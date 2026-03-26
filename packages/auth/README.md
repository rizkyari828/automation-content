# Auth Package

Package ini menampung fondasi auth bersama untuk CreatorFlow.

Saat ini isinya:

- user access token helper berbasis JWT
- internal service token helper berbasis JWT
- opaque refresh token helper
- token hashing utility

Prinsip:

- access token user bersifat short-lived
- refresh token bersifat opaque dan disimpan server-side
- token antar service dipisah dari token user
