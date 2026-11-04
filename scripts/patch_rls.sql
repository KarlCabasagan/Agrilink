ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspended_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id OR ((SELECT role_id FROM profiles WHERE id = auth.uid()) = 3));

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id OR ((SELECT role_id FROM profiles WHERE id = auth.uid()) = 3));

DROP POLICY IF EXISTS "Public view helpful_reviews" ON public.helpful_reviews;
CREATE POLICY "Public view helpful_reviews" ON public.helpful_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth insert helpful_reviews" ON public.helpful_reviews;
CREATE POLICY "Auth insert helpful_reviews" ON public.helpful_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth delete helpful_reviews" ON public.helpful_reviews;
CREATE POLICY "Auth delete helpful_reviews" ON public.helpful_reviews FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth insert reported_reviews" ON public.reported_reviews;
CREATE POLICY "Auth insert reported_reviews" ON public.reported_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin view reported_reviews" ON public.reported_reviews;
CREATE POLICY "Admin view reported_reviews" ON public.reported_reviews FOR SELECT USING (((SELECT role_id FROM profiles WHERE id = auth.uid()) = 3) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Public view suspended_products" ON public.suspended_products;
CREATE POLICY "Public view suspended_products" ON public.suspended_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage suspended_products" ON public.suspended_products;
CREATE POLICY "Admin manage suspended_products" ON public.suspended_products FOR ALL USING ((SELECT role_id FROM profiles WHERE id = auth.uid()) = 3);

DROP POLICY IF EXISTS "Public read roles" ON public.roles;
CREATE POLICY "Public read roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read delivery_methods" ON public.delivery_methods;
CREATE POLICY "Public read delivery_methods" ON public.delivery_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read payment_methods" ON public.payment_methods;
CREATE POLICY "Public read payment_methods" ON public.payment_methods FOR SELECT USING (true);
