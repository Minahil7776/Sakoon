# Psychologist dashboard + profile + extended registration

Copy these files into your project (same paths). Files marked CHANGED overwrite existing ones.

NEW
- app/psychologist/layout.js, page.js, actions.js, controls.js, PsychNav.js, ui.js, icons.js, psychologist.css
- app/psychologist/profile/page.js, forms.js
- app/psychologist/profile/preview/page.js
- app/api/psychologist/photo/route.js
- components/PublicProfile.js, components/public-profile.css, components/field-select.css
- lib/profile.js, lib/psychologist.js, lib/options.mjs

CHANGED
- prisma/schema.prisma   (profile fields, Specialization, PsychologistSpecialization, Qualification)
- prisma/seed.mjs        (RLS on new tables, seeds the specialization list)
- lib/validation.js      (psychologist registration fields)
- app/api/auth/register/route.js
- app/register/page.js   (4 steps for psychologists)
- components/Field.js    (adds SelectField)
- middleware.js          (protects /psychologist)
- app/dashboard/page.js  (sends psychologists to /psychologist)
- .env.example           (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

SETUP
1. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env
2. Supabase dashboard > Storage > New bucket: name "avatars", set Public ON
3. npm run db:push
4. npm run db:seed
5. npm run dev
