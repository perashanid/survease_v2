# Admin System Setup Guide

## Overview

The admin system allows designated users to manage the survey platform, including:
- Managing featured surveys
- Controlling survey visibility (public/private, active/inactive)
- Viewing platform statistics
- Deleting surveys
- Managing users (coming soon)

## Features

### Admin Dashboard
- **Overview Tab**: View platform statistics including total users, surveys, responses, and recent activity
- **Surveys Tab**: Manage all surveys with search and filter capabilities
- **Users Tab**: User management (coming soon)

### Admin Capabilities
- ⭐ **Feature/Unfeature Surveys**: Control which surveys appear in the featured section
- 🌐 **Toggle Public/Private**: Change survey visibility
- ✓ **Activate/Deactivate**: Enable or disable surveys
- 🗑️ **Delete Surveys**: Remove surveys and all associated responses
- 📊 **View Statistics**: Monitor platform usage and trends

## Setup Instructions

### 1. Make a User an Admin

To grant admin privileges to a user, run the following command in the backend directory:

```bash
cd backend
npm run make-admin <user-email>
```

Example:
```bash
npm run make-admin admin@example.com
```

This will:
- Find the user by email
- Set their `is_admin` flag to `true`
- Display confirmation with admin portal URL

### 2. Access the Admin Portal

The admin portal is accessible at a hidden route (not linked in the main navigation):

**Local Development:**
```
http://localhost:3000/#/x-admin-portal
```

**Production:**
```
https://your-domain.com/#/x-admin-portal
```

### 3. Login as Admin

1. Navigate to the admin portal URL
2. Login with your admin credentials
3. You'll be automatically redirected to the admin dashboard

## Security Features

- **Hidden Route**: The admin portal is not mentioned or linked anywhere in the public website
- **Authentication Required**: Users must be logged in to access admin routes
- **Admin-Only Access**: Backend validates admin status on every request
- **403 Forbidden**: Non-admin users receive access denied errors

## API Endpoints

All admin endpoints are prefixed with `/api/admin` and require:
1. Valid JWT authentication token
2. User must have `is_admin: true`

### Available Endpoints

```
GET    /api/admin/surveys              - Get all surveys with filters
GET    /api/admin/stats                - Get platform statistics
GET    /api/admin/users                - Get all users
PATCH  /api/admin/surveys/:id/feature  - Toggle featured status
PATCH  /api/admin/surveys/:id/visibility - Update public/active status
DELETE /api/admin/surveys/:id          - Delete survey
```

## Database Schema Changes

The User model has been updated with a new field:

```typescript
is_admin: {
  type: Boolean,
  default: false
}
```

Existing users will have `is_admin: false` by default.

## Frontend Integration

### AuthContext Updates
The user object now includes `isAdmin` property:

```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  isAdmin?: boolean;  // New field
}
```

### Protected Route
The admin dashboard checks for admin status on mount:

```typescript
if (!user?.isAdmin) {
  showToast('error', 'Access denied. Admin privileges required.');
  navigate('/');
  return;
}
```

## Usage Examples

### Making Multiple Admins

```bash
cd backend
npm run make-admin admin1@example.com
npm run make-admin admin2@example.com
npm run make-admin superadmin@example.com
```

### Featuring a Survey

1. Navigate to admin portal
2. Click "Surveys" tab
3. Find the survey you want to feature
4. Click the ⭐ button
5. Survey will now appear in the featured section on the homepage

### Deleting a Survey

1. Navigate to admin portal
2. Click "Surveys" tab
3. Find the survey to delete
4. Click the 🗑️ button
5. Confirm deletion
6. Survey and all responses will be permanently deleted

## Troubleshooting

### "Access denied" Error
- Ensure the user has been granted admin privileges using `npm run make-admin`
- Verify the user is logged in
- Check that the JWT token is valid

### Admin Portal Not Loading
- Verify the route is correct: `/x-admin-portal`
- Check browser console for errors
- Ensure backend is running and accessible

### Cannot Feature Surveys
- Verify admin privileges are active
- Check backend logs for errors
- Ensure the survey exists and is valid

## Best Practices

1. **Limit Admin Access**: Only grant admin privileges to trusted users
2. **Regular Audits**: Periodically review admin actions and user list
3. **Secure Credentials**: Use strong passwords for admin accounts
4. **Monitor Activity**: Keep track of featured surveys and deletions
5. **Backup Data**: Regularly backup the database before bulk operations

## Future Enhancements

- User management interface
- Activity logs and audit trail
- Bulk operations for surveys
- Advanced analytics and reporting
- Role-based permissions (super admin, moderator, etc.)
- Email notifications for admin actions

## Support

For issues or questions about the admin system, please contact the development team or create an issue in the repository.
