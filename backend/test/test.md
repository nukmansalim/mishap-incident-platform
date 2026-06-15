Berikut **daftar skenario E2E** yang harus diimplementasikan oleh AI agent pembuat test. Setiap item adalah 1 test terpisah. Asumsikan alur selalu dimulai dari **register → login → dapatkan JWT**, lalu gunakan JWT itu untuk semua request lain.

Gunakan penamaan yang konsisten, misalnya: `Team E2E – <judul>`.

***

## A. Setup & Auth

1. **Auth – Register user A (owner candidate)**  
   - Action: `POST /auth/register` dengan body valid.  
   - Expect: 201, response berisi `id` user.

2. **Auth – Login user A**  
   - Action: `POST /auth/login` dengan email/password user A.  
   - Expect: 200, response berisi `accessToken`.  

3. **Setup – Buat organization dan jadikan user A sebagai owner**  
   - Action: Panggil endpoint create-organization (kalau ada) ATAU direct via Prisma (di test) untuk buat `organization` dengan satu `organizationMember` (user A, role `owner`).  
   - Expect: organization dengan `id` (`orgId`) dan row `organizationMember` untuk user A.

4. **Auth – Register user B (member candidate)**  
   - Action: `POST /auth/register` user B.  
   - Expect: 201.

5. **Auth – Login user B**  
   - Action: `POST /auth/login` user B.  
   - Expect: 200, dapat `accessTokenB`.

6. **Setup – Jadikan user B member di org**  
   - Action: via endpoint (kalau ada) atau langsung via Prisma: buat row `organizationMember` untuk user B, `organizationId = orgId`, role `member`.  
   - Expect: row `organizationMember` untuk user B ada di DB.

***

## B. Team – Create / List / Detail / Update / Delete

7. **Create team – owner sebagai member org (happy path)**  
   - Token: user A.  
   - Action: `POST /organizations/{orgId}/teams` body `{ name, description }`.  
   - Expect: 201/200, response berisi `id` (`teamId`), `organizationId = orgId`, `status = active`.

8. **Create team – user bukan member org (forbidden)**  
   - Token: user yang **bukan** member org (bisa user baru C tanpa membership).  
   - Action: `POST /organizations/{orgId}/teams` body valid.  
   - Expect: 403, message `'You are not member of this organization'`.

9. **List teams – member org melihat hanya team active**  
   - Token: user A.  
   - Pre: ada ≥1 team active, dan minimal 1 team `status = inactive` di org tersebut.  
   - Action: `GET /organizations/{orgId}/teams`.  
   - Expect: 200, hanya mengembalikan team dengan `status = active`.

10. **List teams – non-member org (forbidden)**  
    - Token: user yang bukan member org.  
    - Action: `GET /organizations/{orgId}/teams`.  
    - Expect: 403.

11. **Get team details – team milik org dan user member org**  
    - Token: user A.  
    - Pre: team T (`teamId`) dengan `organizationId = orgId`, `status = active`.  
    - Action: `GET /organizations/{orgId}/teams/{teamId}`.  
    - Expect: 200, body berisi detail team + `members` list.

12. **Get team details – team bukan milik org (cross-tenant)**  
    - Token: user A member `orgId1`.  
    - Pre: team T dengan `organizationId = orgId2` (beda org).  
    - Action: `GET /organizations/{orgId1}/teams/{teamId(org2)}`.  
    - Expect: 404, message `'Team not found in this organization'`.

13. **Update team – user member org, team milik org**  
    - Token: user A.  
    - Action: `PATCH /organizations/{orgId}/teams/{teamId}` body `{ name: 'Updated Name' }`.  
    - Expect: 200, DB: `team.name` berubah.

14. **Update team – team bukan milik org**  
    - Token: user A member `orgId1`.  
    - Pre: team T belong ke `orgId2`.  
    - Action: `PATCH /organizations/{orgId1}/teams/{teamId(org2)}`.  
    - Expect: 404.

15. **Update team – user bukan member org**  
    - Token: user non-member org.  
    - Action: `PATCH /organizations/{orgId}/teams/{teamId}`.  
    - Expect: 403.

16. **Delete team – soft delete**  
    - Token: user A member org.  
    - Action: `DELETE /organizations/{orgId}/teams/{teamId}`.  
    - Expect: 200/204, DB: `team.status` berubah menjadi `inactive`.  
    - Verifikasi tambahan: `GET /organizations/{orgId}/teams` tidak mengembalikan team ini.

17. **Delete team – team bukan milik org**  
    - Token: user A (org1).  
    - Action: `DELETE /organizations/{orgId1}/teams/{teamId(org2)}`.  
    - Expect: 404.

18. **Delete team – user bukan member org**  
    - Token: non-member.  
    - Action: `DELETE /organizations/{orgId}/teams/{teamId}`.  
    - Expect: 403.

***

## C. Team Members – Add

19. **Add member – actor & target sama-sama member org, target belum member team (happy path)**  
    - Token: user A (owner/member).  
    - Pre: user B adalah `organizationMember` di org yang sama; belum ada `teamMember(teamId, userB.id)`.  
    - Action: `POST /organizations/{orgId}/teams/{teamId}/members` body `{ userId: userB.id, role: 'viewer' }`.  
    - Expect: 201/200, DB: row `teamMember` baru.

20. **Add member – actor bukan member org**  
    - Token: user non-member org.  
    - Action: `POST /organizations/{orgId}/teams/{teamId}/members` dengan `userId` dari member org.  
    - Expect: 403 (gagal di `ensureOrgMembership(orgId, actor.id)`).

21. **Add member – target bukan member org**  
    - Token: user A (member org).  
    - Pre: user C belum punya membership di org.  
    - Action: `POST /organizations/{orgId}/teams/{teamId}/members` body `{ userId: userC.id, role: 'viewer' }`.  
    - Expect: 403 (gagal di `ensureOrgMembership(orgId, targetUserId)`).

22. **Add member – team bukan milik org**  
    - Token: user A member `orgId1`.  
    - Pre: teamId belong ke org lain.  
    - Action: `POST /organizations/{orgId1}/teams/{teamId(org2)}/members`.  
    - Expect: 404 (`ensureTeamInOrg`).

23. **Add member – target sudah member team (conflict)**  
    - Token: user A member org.  
    - Pre: ada row `teamMember(teamId, userB.id)` sudah ada.  
    - Action: `POST /organizations/{orgId}/teams/{teamId}/members` body `{ userId: userB.id, role: 'viewer' }`.  
    - Expect: 409, message `'User is already a member of this team'`.  
    - DB: tidak ada duplikat kedua.

***

## D. Team Members – Get list

24. **Get members – user member org & team milik org**  
    - Token: user A.  
    - Pre: ada beberapa member di team.  
    - Action: `GET /organizations/{orgId}/teams/{teamId}/members`.  
    - Expect: 200, array berisi semua member team dengan data user (id, name, email, avatarUrl).

25. **Get members – team bukan milik org**  
    - Token: user A member `orgId1`.  
    - Action: `GET /organizations/{orgId1}/teams/{teamId(org2)}/members`.  
    - Expect: 404.

26. **Get members – user bukan member org**  
    - Token: non-member.  
    - Action: `GET /organizations/{orgId}/teams/{teamId}/members`.  
    - Expect: 403.

***

## E. Team Members – Update role

27. **Update member role – actor & target member org, target member team (happy path)**  
    - Token: user A.  
    - Pre: user B adalah member org dan member team dengan role `viewer`.  
    - Action: `PATCH /organizations/{orgId}/teams/{teamId}/members/{userB.id}` body `{ role: 'manager' }`.  
    - Expect: 200, DB: `teamMember(teamId, userB.id).role = 'manager'`.

28. **Update member role – target bukan member org**  
    - Token: user A member org.  
    - Pre: user C bukan `organizationMember` di org.  
    - Action: `PATCH /organizations/{orgId}/teams/{teamId}/members/{userC.id}` body `{ role: 'viewer' }`.  
    - Expect: 403 (gagal di `ensureOrgMembership(orgId, targetUserId)`).

29. **Update member role – target bukan member team**  
    - Token: user A member org.  
    - Pre: user B member org, tapi **bukan** member team T.  
    - Action: `PATCH /organizations/{orgId}/teams/{teamId}/members/{userB.id}`.  
    - Expect: 404, message seperti `'Target user is not a member of this team'`.

30. **Update member role – team bukan milik org**  
    - Token: user A member `orgId1`.  
    - Action: `PATCH /organizations/{orgId1}/teams/{teamId(org2)}/members/{userB.id}`.  
    - Expect: 404.

31. **Update member role – actor bukan member org**  
    - Token: non-member org.  
    - Action: `PATCH /organizations/{orgId}/teams/{teamId}/members/{userB.id}`.  
    - Expect: 403.

***

## F. Team Members – Remove

32. **Remove member – actor & target member org, target member team (happy path)**  
    - Token: user A member org.  
    - Pre: user B member team T.  
    - Action: `DELETE /organizations/{orgId}/teams/{teamId}/members/{userB.id}`.  
    - Expect: 200/204, DB: row `teamMember(teamId, userB.id)` terhapus.

33. **Remove member – target bukan member team**  
    - Token: user A member org.  
    - Pre: user B member org, tapi bukan member team T.  
    - Action: `DELETE /organizations/{orgId}/teams/{teamId}/members/{userB.id}`.  
    - Expect: 404, message `'Team member not found'` (atau wording yang kamu pakai di service).

34. **Remove member – target bukan member org**  
    - Token: user A member org.  
    - Pre: user C bukan member org.  
    - Action: `DELETE /organizations/{orgId}/teams/{teamId}/members/{userC.id}`.  
    - Expect: 403 (gagal di `ensureOrgMembership(orgId, targetUserId)`), atau 404 jika kamu ubah logic.

35. **Remove member – team bukan milik org**  
    - Token: user A member `orgId1`.  
    - Action: `DELETE /organizations/{orgId1}/teams/{teamId(org2)}/members/{userB.id}`.  
    - Expect: 404.

36. **Remove member – actor bukan member org**  
    - Token: non-member org.  
    - Action: `DELETE /organizations/{orgId}/teams/{teamId}/members/{userB.id}`.  
    - Expect: 403.

***
