-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS promote_to_producer(uuid);

-- Create the updated function without transaction control statements
CREATE OR REPLACE FUNCTION promote_to_producer(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Update user role to Producer (role_id = 2)
    UPDATE profiles 
    SET role_id = 2,
        updated_at = now()
    WHERE id = target_user_id
    RETURNING jsonb_build_object(
        'id', id,
        'role_id', role_id,
        'name', name,
        'email', email,
        'updated_at', updated_at
    ) INTO result;

    -- Delete application crops first (foreign key constraint)
    DELETE FROM application_crops
    WHERE application_id IN (
        SELECT id 
        FROM seller_applications 
        WHERE user_id = target_user_id
    );

    -- Then delete the seller applications
    DELETE FROM seller_applications
    WHERE user_id = target_user_id;

    RETURN result;
EXCEPTION
    WHEN others THEN
        -- Log the error (you can customize this based on your logging setup)
        RAISE NOTICE 'Error in promote_to_producer: %', SQLERRM;
        -- Re-raise the error to be handled by the calling code
        RAISE;
END;
$$;
