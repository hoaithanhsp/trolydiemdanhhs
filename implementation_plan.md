# Implementation Plan - Add Login and Header Image

## Problem Description
The user wants to add a specific logo image to the application header (above the app name) and implement a simple login system with hardcoded credentials ("Trần Thị Kim Thoa" / "12345").

## User Review Required
> [!IMPORTANT]
> The login credentials will be hardcoded in the frontend code for simplicity as per the request. This is not secure for production environments but sufficient for this demo/prototype.

## Proposed Changes

### Assets
#### [NEW] [logo_thoa.jpg](file:///c:/Users/admin/Downloads/APP%20QR/qr-attendance/public/logo_thoa.jpg)
- Move the uploaded image to the `public` directory.

### Components
#### [NEW] [LoginModal.tsx](file:///c:/Users/admin/Downloads/APP%20QR/qr-attendance/components/LoginModal.tsx)
- Create a new component for the login modal.
- It will accept `onLogin` prop.
- It will validate username and password.
- It will show an error message for invalid credentials.

### Main Application
#### [MODIFY] [App.tsx](file:///c:/Users/admin/Downloads/APP%20QR/qr-attendance/App.tsx)
- Add state `isLoggedIn` (boolean).
- Check standard login status.
- Conditionally render `LoginModal` if `!isLoggedIn`.
- Update the **Sidebar (Desktop)** and **Mobile Header** to include the new image above the "QR Attend" text or logo.

## Verification Plan

### Manual Verification
1.  **Login Flow**:
    *   Open the app.
    *   Verify that the Login Modal appears immediately.
    *   Try entering wrong credentials. Verify error message.
    *   Enter "Trần Thị Kim Thoa" / "12345".
    *   Verify successful login and access to the dashboard.
2.  **Header Image**:
    *   After login, check the sidebar (desktop) and header (mobile).
    *   Verify the new logo image is displayed above the App Name/Logo section as requested.
