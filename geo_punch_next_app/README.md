This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Runtime configuration

Set these values in the app's `.env` file before starting or building it:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-bytes
ATTENDANCE_RADIUS_METERS=100
ATTENDANCE_UPLOAD_DIR=./data/attendance-uploads
```

The radius is enforced by the server when attendance is submitted. Set it to the employer's approved distance in meters. Selfies are kept outside `public/`; in Docker Compose, the `attendance_uploads` named volume persists them across container replacement. For other deployments, mount `ATTENDANCE_UPLOAD_DIR` on persistent private storage and back it up with the database.

Admin browser sessions use an HttpOnly cookie. Employee API sessions use the bearer token returned by the mobile login endpoint. Passwords created by the app are bcrypt hashes. On the first successful admin login after upgrading, the app converts existing plaintext employee passwords to hashes and clears their plaintext values; an employee logging in first gets the same conversion for their account.

`../SQL/CREATE TABLES.sql` documents the matching schema for a new PostgreSQL database. For existing installations, use Prisma migrations or a reviewed database migration rather than rerunning the create script.

The repository-root database Compose file now requires `POSTGRES_PASSWORD` from a root `.env` file. Do not commit that file. The app's `.env` and the database's `.env` are separate because the two Compose projects are run independently.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


docker build -t musfiquerrhman/geopunch:latest .

docker push musfiquerrhman/geopunch:latest
