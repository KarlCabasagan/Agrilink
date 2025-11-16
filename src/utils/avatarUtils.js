/**
 * Centralized avatar URL resolution with fallback chain
 * Priority: (1) profiles.avatar_url → (2) auth metadata avatar → (3) UI Avatars generated
 *
 * @param {Object} options - Avatar resolution options
 * @param {string} options.profileAvatarUrl - Avatar URL from profiles table (profiles.avatar_url)
 * @param {string} options.displayName - Display name for UI Avatars fallback (from profiles.name)
 * @param {string} options.authMetadataAvatarUrl - Avatar URL from auth user metadata
 * @param {string} options.authFullName - Full name from auth metadata (for fallback display name)
 * @param {string} options.authDisplayName - Display name from auth metadata (for fallback display name)
 * @param {string} options.email - Email address (for final fallback display name)
 * @returns {string} Final avatar URL to render
 *
 * @example
 * // Using profile data only
 * const avatarUrl = getAvatarUrl({
 *   profileAvatarUrl: user.profile.avatar_url,
 *   displayName: user.profile.name,
 *   email: user.email
 * });
 *
 * @example
 * // Using profile + auth metadata
 * const avatarUrl = getAvatarUrl({
 *   profileAvatarUrl: profile.avatar_url,
 *   displayName: profile.name,
 *   authMetadataAvatarUrl: user.user_metadata?.avatar_url,
 *   authFullName: user.user_metadata?.full_name,
 *   email: user.email
 * });
 */
export function getAvatarUrl({
    profileAvatarUrl = null,
    displayName = null,
    authMetadataAvatarUrl = null,
    authFullName = null,
    authDisplayName = null,
    email = null,
} = {}) {
    // Step 1: Check if profile avatar URL exists and is not empty
    if (profileAvatarUrl && profileAvatarUrl.trim() !== "") {
        return profileAvatarUrl;
    }

    // Step 2: Check if auth metadata avatar exists
    if (authMetadataAvatarUrl && authMetadataAvatarUrl.trim() !== "") {
        return authMetadataAvatarUrl;
    }

    // Step 3: Determine best display name for UI Avatars fallback
    let nameForAvatar =
        displayName ||
        authFullName ||
        authDisplayName ||
        email?.split("@")[0] ||
        "User";

    // Clean up the name (remove extra whitespace)
    nameForAvatar = nameForAvatar.trim();

    // Generate UI Avatars URL with the display name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        nameForAvatar
    )}&background=random`;
}

/**
 * Simpler version for use cases where you have a profile object with nested auth user
 * Useful when you have both profile data and current auth context
 *
 * @param {Object} profile - Profile object from database
 * @param {string} profile.avatar_url - Avatar URL from profiles table
 * @param {string} profile.name - Display name
 * @param {string} profile.email - Email
 * @param {Object} authUser - Supabase auth user object (optional)
 * @param {Object} authUser.user_metadata - Auth user metadata
 * @param {string} authUser.user_metadata.avatar_url - Avatar from metadata
 * @param {string} authUser.user_metadata.full_name - Full name from metadata
 * @param {string} authUser.user_metadata.display_name - Display name from metadata
 * @returns {string} Final avatar URL to render
 *
 * @example
 * const avatarUrl = getProfileAvatarUrl(profile, authUser);
 */
export function getProfileAvatarUrl(profile = {}, authUser = null) {
    return getAvatarUrl({
        profileAvatarUrl: profile.avatar_url,
        displayName: profile.name,
        authMetadataAvatarUrl: authUser?.user_metadata?.avatar_url,
        authFullName: authUser?.user_metadata?.full_name,
        authDisplayName: authUser?.user_metadata?.display_name,
        email: profile.email || authUser?.email,
    });
}

/**
 * Version for review/comment scenarios where you have a reviewer object
 * with nested profile information
 *
 * @param {Object} reviewer - Reviewer object (e.g., from reviews query)
 * @param {Object} reviewer.profiles - Nested profile from join
 * @param {string} reviewer.profiles.avatar_url - Avatar URL
 * @param {string} reviewer.profiles.name - Display name
 * @param {string} reviewer.profiles.email - Email
 * @returns {string} Final avatar URL to render
 *
 * @example
 * const avatarUrl = getReviewerAvatarUrl(review.profiles);
 */
export function getReviewerAvatarUrl(profiles = {}) {
    return getAvatarUrl({
        profileAvatarUrl: profiles.avatar_url,
        displayName: profiles.name,
        email: profiles.email,
    });
}
