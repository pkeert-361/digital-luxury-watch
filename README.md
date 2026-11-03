# ÉLÉGANCE — Digital Luxury Watches

A responsive luxury-watch e-commerce demo built with HTML, CSS, JavaScript and Node.js/Express.

## Features
- Responsive luxury storefront and watch collection
- Product search, category filter and price sorting
- Shopping bag with quantity controls
- Customer registration and login (bcrypt password hashing + JWT)
- Demo checkout and customer order history
- Admin dashboard to add and delete watches
- JSON-file data storage; no MongoDB setup required

## Run locally
1. Install Node.js 18 or newer.
2. Download/extract this project and open the folder in VS Code.
3. Open Terminal in VS Code and run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and change `JWT_SECRET` and admin credentials.
5. Start the app:
   ```bash
   npm start
   ```
6. Open `http://localhost:5000`.

## Demo admin account
Default values (change them before deployment):
- Email: `admin@luxewatches.demo`
- Password: `WatchAdmin@123`

## Deploy on Render
1. Push the complete project folder to a GitHub repository.
2. In Render, choose **New + → Web Service** and connect the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
   - `JWT_SECRET` = a long random secret
   - `ADMIN_EMAIL` = your chosen admin email
   - `ADMIN_PASSWORD` = a strong admin password
6. Deploy. Render supplies the `PORT` variable automatically.

## Important project notes
- This is a student/demo e-commerce project. Checkout records an order but does **not** collect payment. Do not enter real card details.
- The included JSON database is suitable for a local demonstration. On free cloud hosting, local files may be temporary and can be reset during redeploy/restart. For production, use a persistent database (for example PostgreSQL) and a persistent disk.
- Product photos are loaded from Unsplash URLs and require an internet connection.
- Change the demo brand, contact details, images, prices and admin credentials before presenting the project.
