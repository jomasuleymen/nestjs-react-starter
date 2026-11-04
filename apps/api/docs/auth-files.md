# Auth and Files

## Authentication

The API uses short-lived access JWTs and a refresh JWT stored in the
`refresh_token` HTTP-only cookie. Clients send the access token as
`Authorization: Bearer <token>`.

| Method | Route               | Authentication | Purpose                                            |
| ------ | ------------------- | -------------- | -------------------------------------------------- |
| `POST` | `/api/auth/login`   | Public         | Create a session and return access token plus user |
| `POST` | `/api/auth/refresh` | Refresh cookie | Validate the session and return fresh tokens       |
| `POST` | `/api/auth/logout`  | Public         | Clear the refresh cookie                           |
| `GET`  | `/api/auth/me`      | Bearer token   | Return the current active user                     |

The refresh JWT contains the user ID and session ID. The session is created only
during login and stores only client metadata. Refresh validates that the same
session exists and never creates another session. Logout clears the browser
cookie only.

The template defines `USER` and `ADMIN` roles and retains the existing role guard
and decorators. File ownership is enforced for both roles; admin status does not
grant access to another user's files. Account registration and initial user
provisioning are not included in this stage.

Access authentication verifies the JWT and loads the active user from
PostgreSQL. Blocking a user therefore takes effect immediately instead of
waiting for all access tokens to expire.

## File Upload Flow

All file endpoints require a bearer token. A user can access only records whose
`ownerUserId` matches the authenticated user.

| Method   | Route                         | Purpose                                                  |
| -------- | ----------------------------- | -------------------------------------------------------- |
| `POST`   | `/api/files/uploads`          | Create a pending file and receive a presigned upload URL |
| `POST`   | `/api/files/:id/complete`     | Verify the uploaded object and mark the file ready       |
| `GET`    | `/api/files/:id/download-url` | Receive a short-lived presigned download URL             |
| `DELETE` | `/api/files/:id`              | Logically delete the file and start physical deletion    |

Upload sequence:

1. Call `POST /api/files/uploads` with `originalName`, `contentType`,
   `sizeBytes` and optional hex-encoded `checksumSha256`.
2. Upload the body directly to `uploadUrl` using every header returned in
   `requiredHeaders`.
3. Call `POST /api/files/:id/complete`.
4. The API compares object size, content type and optional checksum before
   changing the state from `PENDING` to `READY`.

Allowed content types and limits are defined in `files.constants.ts`. Download
URLs are issued only for `READY` files.

## File States

```text
PENDING -> READY -> DELETING -> DELETED
    |                    ^
    +--------------------+
       expired upload
```

Deletion is intentionally two-phase. If object storage is unavailable, the
database record remains `DELETING`; the files cleanup worker retries it. Expired
pending uploads use the same deletion path.
