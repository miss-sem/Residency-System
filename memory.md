Weekly Residency Activity Submission System

# Project Overview

The application is a simple Residency Activity Submission System designed for residents to submit their weekly activities and for administrators to review and provide feedback.

The system focuses on a clean and simple workflow:

Resident logs weekly activities → submits report at the end of the week → admin reviews submission → admin sends feedback.

The application is intentionally kept simple to ensure fast development, easy maintenance, and a smooth user experience.

---

# Main Objective

Build a clean and functional web application where:

* Residents can log weekly activities for 5 working days
* Residents can submit weekly reports
* Admins can review submissions
* Admins can send feedback to residents
* Residents can view feedback and submission history

---

# Tech Stack (MERN Stack)

## Frontend

* React.js
* React Router
* Axios
* Tailwind CSS
* React Icons
* React Hook Form (optional)

---

## Backend

* Node.js
* Express.js

---

## Database

* MongoDB
* Mongoose ODM

---

## Authentication

* JWT Authentication
* bcrypt.js for password hashing

---

## File Handling (Optional)

* Multer

---

## Deployment

Frontend:

* Vercel or Netlify

Backend:

* Render or Railway

Database:

* MongoDB Atlas

---

# User Roles

The application only requires two roles.

## 1. Resident

Residents are able to:

* Login/logout
* Fill weekly activity forms
* Save draft reports
* Submit weekly reports
* View submission history
* View admin feedback

---

## 2. Admin

Admins are able to:

* Login/logout
* Create resident accounts
* View all residents
* Review submitted reports
* Send feedback/comments
* Mark reports as reviewed
* View dashboard statistics

---

# Core Features

# 1. Authentication System

The app should include a simple authentication system.

## Features

* Login
* Logout
* Protected routes
* JWT authentication
* Password hashing
* Role-based access

---

# 2. Resident Management

Admins should be able to manage resident accounts.

## Features

* Create resident account
* View resident list
* Edit resident details
* Delete resident account

## Resident Fields

* Full name
* Email
* Password
* Department/unit
* Role

---

# 3. Weekly Activity Submission System

This is the main feature of the application.

Residents should be able to fill weekly activity reports.

## Weekly Structure

Residents enter activities for:

* Monday
* Tuesday
* Wednesday
* Thursday
* Friday

---

## Activity Form Fields

Each report should contain:

* Week starting date
* Monday activity
* Tuesday activity
* Wednesday activity
* Thursday activity
* Friday activity
* Additional notes

---

## Submission Features

Residents should be able to:

* Create weekly report
* Save draft
* Edit draft before submission
* Submit report
* View report history

---

# 4. Report Status System

Each report should have a status.

## Status Types

* Draft
* Submitted
* Reviewed

---

# 5. Admin Review System

Admins should be able to review weekly reports.

## Features

* View submitted reports
* Open full weekly report
* Read all daily activities
* Add feedback/comments
* Mark report as reviewed

---

## Review Workflow

1. Resident creates weekly report
2. Resident submits report
3. Report status becomes Submitted
4. Admin reviews report
5. Admin adds feedback/comments
6. Admin marks report as Reviewed
7. Resident views feedback

---

# 6. Feedback System

Admins should be able to provide feedback on submissions.

## Features

* Add comments to reports
* Send feedback to resident
* Residents can view feedback

## Example Feedback

* “Please provide more details for Wednesday activities.”
* “Good work on community outreach activities.”
* “Kindly improve documentation format.”

---

# 7. Dashboard

The application should include simple dashboards.

---

## Admin Dashboard

Display:

* Total residents
* Total reports
* Submitted reports
* Reviewed reports
* Pending reviews

---

## Resident Dashboard

Display:

* Submitted reports
* Reviewed reports
* Draft reports
* Recent feedback

---

# 8. Submission History

Residents should be able to:

* View previously submitted reports
* Open old reports
* Read admin feedback
* Track report statuses

---

# 9. Search & Filtering

Admins should be able to:

* Search residents
* Filter reports by status
* Filter reports by resident
* Filter reports by week/date

---

# 10. File Uploads (Optional)

Residents may optionally upload:

* Images
* PDFs
* Supporting documents

This can be attached to weekly reports.

---

# Recommended Database Structure

# Users Collection

## Fields

* name
* email
* password
* role
* department
* createdAt

---

# Weekly Reports Collection

## Fields

* residentId
* weekStartDate
* mondayActivity
* tuesdayActivity
* wednesdayActivity
* thursdayActivity
* fridayActivity
* additionalNotes
* status
* adminFeedback
* submittedAt
* reviewedAt
* createdAt

---

# Suggested Pages

# Public Pages

* Login page

---

# Resident Pages

* Resident dashboard
* Create weekly report
* Report history
* View feedback
* Profile page

---

# Admin Pages

* Admin dashboard
* Resident management
* Reports management
* Review report page
* Feedback page

---

# Suggested Backend API Modules

## Authentication APIs

* Login
* Logout
* Get current user

---

## Resident APIs

* Create resident
* Get all residents
* Update resident
* Delete resident

---

## Weekly Report APIs

* Create report
* Save draft
* Submit report
* Get resident reports
* Get all reports
* Review report
* Add feedback

---

# Suggested UI Components

* Sidebar navigation
* Navbar
* Tables
* Status badges
* Forms
* Text areas
* Modals
* Dashboard cards
* Loading spinners
* Empty states

---

# Suggested Folder Structure

## Frontend

* components
* pages
* layouts
* hooks
* services
* routes
* context/store
* utils

---

## Backend

* controllers
* models
* routes
* middleware
* config
* utils
* services




---

# Final Application Workflow

1. Admin creates resident accounts
2. Resident logs into the system
3. Resident fills weekly activities for Monday–Friday
4. Resident submits weekly report
5. Admin reviews the report
6. Admin sends feedback/comments
7. Resident views feedback and report history
Final Goal
he final application should be a clean, simple, and functional residency activity management system that allows residents to submit weekly activities and receive administrative feedback through an organized digital workflow.

use this colour #D92243 and a nice shade of white to match it

no implementation yet, what is your understand