# Firestore Security Specification

## Data Invariants
1. Public catalog documents (`/plants`, `/events`) are readable by all visitors and writable only by verified administrators.
2. `/plantJourneys/{recordCode}` can be read publicly only when `status == 'Published'`. Creation and deletion are restricted to verified administrators.
3. Verified signed-in users (`email_verified == true`) updating a published `/plantJourneys/{recordCode}` may only update `participantPlantPhoto`, `plantPhoto`, `personalMessage`, and `updatedAt`, preserving `plantIdCode`, `fullName`, `plantId`, `eventId`, `cardFrontPhoto`, `status`, and `createdAt`.
4. Growth updates live in `/plantJourneys/{recordCode}/growthUpdates/{updateId}` (subcollection, never unbounded arrays), require an existing published parent `/plantJourneys/{recordCode}`, enforce `authorUid == request.auth.uid`, and validate strict string sizes and server timestamps.
5. Admin integration settings (`/settings/{settingId}`) and admin role records (`/admins/{uid}`) are restricted strictly to verified admins.

## Adversarial Payloads Checked
1. Unauthenticated write to `/plantJourneys/SB26-0001` -> DENIED.
2. Unverified email (`email_verified: false`) admin spoofing -> DENIED.
3. Shadow field injection (`isAdmin: true`, `extraField: 1`) on `create`/`update` -> DENIED via `hasOnly()`.
4. Overwriting immutable fields (`fullName`, `plantIdCode`, `createdAt`) by non-admin user -> DENIED.
5. Path variable poisoning (`recordCode` > 128 chars or invalid chars) -> DENIED via `isValidId()`.
6. Oversized payload (> 220KB photo string or > 600 char message) -> DENIED via `.size()` bounds.
7. Orphaned growth update without existing published parent journey -> DENIED via `exists()` & `get()`.
8. Non-admin reading `/settings/gform` (Google Sheet URL) -> DENIED.
9. Self-escalation writing to `/admins/{uid}` -> DENIED.
10. Client-forged `createdAt` or `updatedAt` timestamp -> DENIED via `== request.time`.
11. Listing Draft plant journeys by unauthenticated caller -> DENIED via `resource.data.status == 'Published'`.
12. Deleting any plant journey or growth update by non-admin -> DENIED.
