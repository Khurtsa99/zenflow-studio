# ZenFlow Studio: фитнес/йогийн гишүүнчлэл ба ангийн бүртгэл

SWE334 Internet Programming-ийн бие даалтын төсөл. React (Vite) + Supabase + Stripe (sandbox) + Vercel.

**Шийдэх асуудал:** жижиг студиуд гишүүнчлэл, ангийн хуваарь, ирцийг Facebook/дэвтэр/Excel-ээр удирддаг тул анги дүүрэх, төлбөр алдагдах, гишүүнчлэл мартагдах асуудал гардаг. ZenFlow нь эдгээрийг нэг системд нэгтгэнэ.

## Хэрэглэгчийн төрөл
| Эрх | Боломж |
|---|---|
| Зочин | Анги, дасгалжуулагч, багц харах, хайх, шүүх |
| Гишүүн | Багц худалдан авах (онлайн төлбөр), ангид бүртгүүлэх/цуцлах, QR код, төлбөрийн түүх |
| Админ | Анги, төрөл, дасгалжуулагч, багц CRUD, хэрэглэгчийн эрх, төлбөр, статистик, QR ирц |

## Суулгах заавар (local)
```bash
npm install
cp .env.example .env     # Supabase URL болон anon key-ээ бөглө
npm run dev              # http://localhost:5173
```

1. [supabase.com](https://supabase.com) дээр төсөл үүсгэнэ.
2. **SQL Editor** дээр `supabase/schema.sql`-ийг бүхлээр нь ажиллуулна (хүснэгт, RLS, storage bucket, туршилтын өгөгдөл).
3. **Authentication → Providers → Email** дээр хөгжүүлэлтийн үед "Confirm email"-ийг унтрааж болно.
4. **Authentication → URL Configuration** дээр Site URL болон Redirect URL-д `http://localhost:5173/**` болон production домэйнээ нэмнэ (нууц үг сэргээхэд хэрэгтэй).
5. App дээр өөрөө бүртгүүлээд, SQL Editor дээр админ болгоно:
   ```sql
   update public.profiles set role = 'admin' where email = 'ТАНЫ_EMAIL';
   ```

## Төлбөрийн тохиргоо (Stripe sandbox + webhook)
```bash
npm i -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>

supabase secrets set STRIPE_SECRET_KEY=sk_test_... \
                     STRIPE_WEBHOOK_SECRET=whsec_... \
                     SITE_URL=http://localhost:5173 \
                     MNT_PER_USD=3400

supabase functions deploy create-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```
- Stripe Dashboard (test mode) → **Developers → Webhooks → Add endpoint**:
  `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`, event: `checkout.session.completed`, `checkout.session.expired`. Гарсан `whsec_...`-ийг дээрх `STRIPE_WEBHOOK_SECRET`-д өгнө.
- Stripe MNT-ийг дэмждэггүй тул sandbox-д ₮-ийг `MNT_PER_USD` ханшаар USD болгож төлүүлнэ. Дэлгэц дээр үнэ үргэлж ₮-өөр харагдана.
- Production дээр `SITE_URL`-ийг өөрийн домэйн болгож солино.
- (QPay/Byl ашиглах бол `create-checkout` дотор нэхэмжлэх үүсгэх хэсгийг сольж, webhook-ийн төгсгөл ижил байна.)

### Төлбөр туршиж үзэх
1. Гишүүнээр нэвтэрч **Гишүүнчлэл → Худалдан авах**.
2. Карт: `4242 4242 4242 4242`, дурын ирээдүйн огноо, дурын CVC.
3. Төлсний дараа webhook `payments.status`-ийг `pending → paid` болгож, `memberships`-ийг `active` болгоно. `/payment/success` хуудас автоматаар шинэчлэгдэнэ.

## Байршуулалт (Vercel + өөрийн домэйн)
1. Кодоо GitHub-д push хийнэ.
2. Vercel дээр репог import хийнэ (Framework: Vite).
3. **Environment Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. **Settings → Domains** дээр домэйнээ нэмж DNS бичлэгээ тохируулна (HTTPS автоматаар).
5. Supabase Auth-ын Site URL/Redirect URL болон `SITE_URL` secret-ийг production домэйнээр шинэчилнэ.

`vercel.json` нь SPA route-уудыг (`/classes/5` гэх мэт) refresh хийхэд ажиллуулдаг.

## Аюулгүй байдал
- Бүх 8 хүснэгтэд RLS идэвхтэй. Гишүүн зөвхөн өөрийн `bookings`, `memberships`, `payments`-ыг харна.
- `memberships`, `payments`-д бичих эрх хэрэглэгчид **байхгүй**. Зөвхөн Edge Function (service_role) бичнэ.
- Хэрэглэгч `role`-оо өөрчилж чадахгүй (`profiles_update_own` policy).
- `service_role` түлхүүр frontend болон репод **байхгүй**. Зөвхөн Supabase secrets дотор.
- `.env` нь `.gitignore`-д орсон, `.env.example` нь жишээ.

## Шаардлагын биелэлт
| Шаардлага | Хаана |
|---|---|
| Бүртгэл, эрх, нууц үг сэргээх | `context/AuthContext.jsx`, `Login/Register/ForgotPassword/ResetPassword`, `ProtectedRoute`, `AdminRoute` |
| 6+ хүснэгт, PK/FK, 1:N, N:M | `supabase/schema.sql` (8 хүснэгт, `bookings` = N:M) |
| CRUD, validation, устгахын өмнөх баталгаажуулалт | `components/AdminCrud.jsx`, `ConfirmDialog.jsx` |
| Зураг (Storage, урьдчилан харах, хязгаар) | `ImageUpload.jsx`, `lib/storage.js` (2MB, jpg/png/webp) |
| Төлбөр + webhook | `supabase/functions/*`, `pages/Plans.jsx`, `PaymentSuccess.jsx` |
| Хайлт, шүүлт, эрэмбэ, pagination | `pages/Classes.jsx`, `Pagination.jsx`, админ хүснэгтүүд |
| Админ самбар (график, хүснэгт) | `pages/admin/Dashboard.jsx` |
| UI/UX (responsive, loading/empty/error, toast) | `Spinner`, `EmptyState`, `ErrorBox`, `react-hot-toast`, Tailwind |
| Аюулгүй байдал | RLS, `.env`, service_role зөвхөн Edge Function |
| Байршуулалт | `vercel.json`, дээрх заавар |

## Дизайн
Хөх тэнгэр (#1D5BD8) ба шаргал (#F4B63F) өнгө, Unbounded + Manrope фонт. Нүүр хуудасны амьсгал заагч дугуй (4 сек амьсгал, 6 сек гаргалт), ангиудыг цагийн хуваарь хэлбэрээр харуулсан. Тохиргоо: `tailwind.config.js`, `src/index.css`.

## Админ: багц олгох
Админ → Хэрэглэгчид → "Багц олгох" нь студид бэлнээр эсвэл шилжүүлгээр төлсөн гишүүнд гишүүнчлэл олгож, төлбөрийг "Төлөгдсөн" төлөвтэй бүртгэнэ. Stripe тохируулахаас өмнө ч бүх урсгалыг туршиж болно.

## Ялгарах онцлог
- Захиалгын дүрмийг өгөгдлийн сан дээр trigger-ээр хамгаалсан (`bookings_guard`): идэвхтэй гишүүнчлэл шаардана, багцын ангийн эрхийн хязгаар, дүүрсэн анги, эхэлсэн ангийг цуцлахгүй, зэрэг захиалахад багтаамж давахгүй (`for update` түгжээ).
- QR кодоор ирц бүртгэнэ (`check_in` функц, зөвхөн админ).

## Туршилтын эрх (Хамгаалалт-2-д бөглөнө)
| Эрх | Имэйл | Нууц үг |
|---|---|---|
| Админ | _бөглөнө_ | _бөглөнө_ |
| Гишүүн | _бөглөнө_ | _бөглөнө_ |
