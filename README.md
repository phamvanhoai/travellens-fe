# Travel360 Frontend

Travel360 is a travel booking and virtual tourism frontend built with Next.js, TypeScript and Tailwind CSS. The app supports public travel browsing, customer dashboards, admin management, staff workflows, 360 experiences, maps, reviews, blogs, payments and AI assistant UI.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Axios
- Zustand
- Recharts
- Lucide React

## Environment

Create `.env` from `.env.example`:

```env
NEXT_PUBLIC_API_URL=https://travellens-gamma.vercel.app/api
```

API client config is located at:

```text
src/services/api.ts
```

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Validation

```bash
npm run typecheck
npm run build
```

## Core Business Model

The frontend follows this backend model:

```text
Tour
  -> TourDestination
    -> TravelDestination
      -> Location
        -> Map
        -> View360
          -> View360Image
        -> Review
        -> Blog
```

Important rules:

- `Tour` contains multiple `TravelDestination` records through `TourDestination`.
- `TravelDestination` contains multiple `Location` records.
- `Location` is an internal area inside a travel destination, not an independent destination.
- `Map` is a visitor diagram image inside a location, not Google Maps.
- `View360` belongs to a location and contains multiple `View360Image` records.

## Main Routes

### Public

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/destinations`
- `/destinations/[id]`
- `/tours`
- `/tours/[id]`
- `/locations/[id]`
- `/view360`
- `/blogs`
- `/blogs/[id]`
- `/booking`
- `/payment/checkout`
- `/payment/success`
- `/payment/failed`
- `/ai`

### User Dashboard

- `/dashboard/profile`
- `/dashboard/bookings`
- `/dashboard/payments`
- `/dashboard/reviews`
- `/dashboard/saved`
- `/dashboard/change-password`

User dashboard includes avatar upload preview, booking history with edit/search/pagination, payment history with search/pagination, review edit/search/pagination, saved item pagination and password change UI.

### Admin

- `/admin`
- `/admin/destination-categories`
- `/admin/travel-destinations`
- `/admin/tour-categories`
- `/admin/tours`
- `/admin/locations`
- `/admin/maps`
- `/admin/view360`
- `/admin/bookings`
- `/admin/payments`
- `/admin/blogs`
- `/admin/reviews`
- `/admin/users`
- `/admin/statistics`

Admin pages include CRUD-style mock UI, search, pagination, upload previews and confirm-delete modals where relevant.

### Staff

- `/staff/coupons`
- `/staff/bookings`
- `/staff/booking-details`
- `/staff/reviews`
- `/staff/payments`

Staff pages cover coupon management, booking updates/cancel, booking passenger details, review moderation and payment status/refund workflows.

## UI Features

- Responsive travel platform layout
- Dark/light mode toggle
- Language dropdown mock UI
- Wishlist dropdown mock UI
- Active sidebar state for dashboard, admin and staff
- Floating AI assistant mock chat
- Shared pagination component
- Shared confirm dialog component
- Upload previews for avatar, destination images, tour images, map diagrams, View360 audio and View360 images

## Project Structure

```text
src/
  app/
    admin/
    ai/
    blogs/
    booking/
    dashboard/
    destinations/
    locations/
    login/
    payment/
    register/
    reset-password/
    staff/
    tours/
    view360/
  components/
    admin/
    auth/
    cards/
    charts/
    common/
    dashboard/
    destinations/
    layout/
    ui/
  constants/
  hooks/
  lib/
  services/
  store/
  types/
  utils/
```

## Notes

- Current screens use mock data and are ready to connect to backend services.
- `.env.example` is intended for GitHub.
- `.env` contains the current API URL for local development.
