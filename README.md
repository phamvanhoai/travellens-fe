# Travel360 Frontend Source

## Project Overview

Travel360 is a travel booking and virtual tourism platform.

The frontend must support:
- Travel destination browsing
- Tour booking
- Location detail pages
- Interactive map display
- 360 virtual tour experience
- Booking multiple passengers
- Payment flow
- User dashboard
- Admin dashboard
- Blog and review system
- AI chatbot
- AI travel suggestions
- Google OAuth login

---

## Tech Stack

Use:

- React.js
- Next.js
- TypeScript
- Tailwind CSS
- ShadCN UI
- Framer Motion
- Axios
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Recharts
- Lucide React

---

## UI Style

Design style:

- Modern travel platform
- Clean and premium
- Similar inspiration: Airbnb, Booking.com, Klook
- Large travel images
- Smooth animation
- Responsive design
- Mobile-first
- Dark/light mode support
- Friendly dashboard layout

---

## Main Entities

Frontend must support these backend entities:

- User
- DestinationCategory
- TourCategory
- TravelDestination
- Tour
- Location
- Map
- View360
- View360Image
- Booking
- BookingDetail
- Payment
- Blog
- Review
- Statistics

---

## Required Pages

### Public Pages

1. Home Page
- Hero section
- Destination search
- Featured destinations
- Popular tours
- 360 experience preview
- AI suggestion section
- Blog preview

2. Login Page
- Email/password login
- Google login button

3. Register Page

4. Travel Destination List Page
- Search
- Filter by DestinationCategory
- Destination cards

5. Travel Destination Detail Page
- Destination information
- Related tours
- Related locations
- Map preview
- View360 preview

6. Tour List Page
- Search
- Filter by TourCategory
- Price filter
- Capacity display

7. Tour Detail Page
- Tour description
- Schedule
- Price
- Capacity
- Booking button
- Reviews

8. Location Detail Page
- Location description
- Map section
- View360 gallery
- Reviews
- Related blogs

9. View360 Experience Page
- Fullscreen 360 viewer layout
- Scene navigation
- Image sequence by order_index
- Audio narration controls
- Description panel
- Back button

10. Blog List Page

11. Blog Detail Page

---

## User Pages

### User Dashboard

Routes:

- `/dashboard/profile`
- `/dashboard/bookings`
- `/dashboard/payments`
- `/dashboard/reviews`
- `/dashboard/saved`

Functions:

- View/update profile
- View booking history
- View payment history
- Cancel booking
- View review history
- View saved tours/destinations

---

## Booking Flow

Create booking flow:

1. Select tour
2. Enter passenger list
3. Support passenger types:
   - adult
   - child
   - infant
4. Show price calculation
5. Submit booking
6. Go to payment page
7. Show booking status

Booking form fields:

- passenger_name
- age_category
- seat_number optional
- special_request optional

---

## Payment Flow

Payment pages must support:

- Payment checkout
- Payment success
- Payment failed
- Refund status
- Transaction detail

Show:

- booking_id
- amount
- payment_method
- payment_status
- transaction_code
- currency

---

## Admin Dashboard

Admin routes:

- `/admin`
- `/admin/travel-destinations`
- `/admin/tours`
- `/admin/locations`
- `/admin/view360`
- `/admin/maps`
- `/admin/bookings`
- `/admin/payments`
- `/admin/blogs`
- `/admin/reviews`
- `/admin/users`
- `/admin/statistics`

Admin features:

1. Dashboard Overview
- Total users
- Total bookings
- Total revenue
- Cancelled bookings
- Popular tours
- Popular destinations

2. TravelDestination Management
- List
- Create
- Update
- Delete

3. Tour Management
- List
- Create
- Update
- Delete
- Capacity display

4. Location Management
- List locations
- Create location
- Update location
- Delete location

5. View360 Management
- List View360 by Location
- Create View360 scene
- Update View360
- Delete View360
- Add View360 images
- Sort images by order_index
- Add audio narration

6. Map Management
- Upload/store map file URL
- Attach map to Location

7. Booking Management
- List bookings
- View booking detail
- Cancel booking
- Update status

8. Payment Management
- List payments
- View transaction detail
- Refund status

9. Blog Management
- List blogs
- Approve/reject blog
- Delete blog

10. Review Management
- List reviews
- Moderate reviews
- Delete inappropriate review

11. User Management
- List users
- Update status
- Change role

12. Statistics
- Revenue chart
- Booking chart
- Top destinations
- Top tours
- Cancellation statistics

---

## AI Features

Create UI for:

1. AI Chatbot
- Floating chat button
- Chat modal
- User message
- AI response
- Loading state

2. AI Travel Suggestions
- Suggest destinations
- Suggest tours
- Personalized recommendation cards

---

## Folder Structure

Generate frontend source with this structure:

```text
src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── login/
│   ├── register/
│   ├── destinations/
│   ├── tours/
│   ├── locations/
│   ├── view360/
│   ├── blogs/
│   ├── dashboard/
│   └── admin/
├── components/
│   ├── common/
│   ├── ui/
│   ├── layout/
│   ├── cards/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   ├── modals/
│   └── view360/
├── features/
│   ├── auth/
│   ├── destinations/
│   ├── tours/
│   ├── locations/
│   ├── view360/
│   ├── booking/
│   ├── payment/
│   ├── blog/
│   ├── review/
│   ├── admin/
│   ├── statistics/
│   └── ai/
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── destination.service.ts
│   ├── tour.service.ts
│   ├── location.service.ts
│   ├── view360.service.ts
│   ├── booking.service.ts
│   ├── payment.service.ts
│   ├── blog.service.ts
│   ├── review.service.ts
│   └── statistics.service.ts
├── hooks/
├── store/
├── types/
├── constants/
├── utils/
├── lib/
└── styles/