PharmaMB – Pharmacy Management System (MVP)
📌 Project Overview

PharmaMB is a web-based pharmacy management system developed as an MVP (Minimum Viable Product) for the PROJ 201 course.
The goal of the project is to deliver a fully functional and usable application, rather than focusing on complex software theory.

The system allows pharmacies to:

Manage products and stock

Perform sales operations

Automatically track stock changes

Monitor daily operations via a dashboard

Use a simple login flow to simulate real-world access control

🎯 Project Objectives

Build a realistic pharmacy management workflow

Ensure the system is functional end-to-end

Provide a clean and professional UI

Keep the architecture simple and maintainable

Focus on usability instead of unnecessary complexity

🧱 System Architecture

The project follows a full-stack architecture:

Backend

Node.js + Express

MySQL database

Prisma ORM for database modeling and queries

RESTful API design

Frontend

React (Vite)

Tailwind CSS for modern UI styling

Axios for API communication

🗄 Database Design

The database is designed to reflect real pharmacy operations.

Main entities:

Pharmacy

User (owner or staff)

Product (stock, expiry date, barcode)

Sale (product, quantity, timestamp)

Relationships:

A pharmacy owns multiple products

Each sale is linked to a product

Stock is automatically reduced after sales

✨ Features
🔐 Login (MVP Authentication)

Simple login screen

Simulated authentication using local storage

Used to demonstrate access control flow

📊 Dashboard

Total number of products

Total stock amount

Low-stock warning (critical products)

Daily sales statistics

📦 Product Management

Add new products

Track stock and expiry dates

Low stock warning (visual)

Clean card-based product layout

💰 Sales Management

Create new sales

Automatic stock deduction

View sales history

Real-time update of dashboard statistics

🖥 User Interface

Clean and minimal design

Responsive layout

Dashboard-style navigation

Designed to simulate a commercial pharmacy system

🚀 How to Run the Project
Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

Frontend
cd frontend
npm install
npm run dev

📌 Notes

Authentication is intentionally kept simple for MVP scope

The project is fully functional without additional setup

Designed for demonstration and evaluation purposes

✅ Conclusion

PharmaMB successfully delivers a working, realistic pharmacy management system.
The project prioritizes practical usability, clarity, and completeness, making it suitable for real-world adaptation as well as academic evaluation.
