# Smoke Test Checklist

Run these tests after every deployment:

1. [ ] **Homepage Load**: `curl -I https://example.com` returns 200 OK.
2. [ ] **API Health**: `curl https://api.example.com/health` returns `{"status":"ok"}`.
3. [ ] **Login**: Can login with demo credentials?
4. [ ] **Upload**: Can upload a dummy PDF?
5. [ ] **Blockchain**: Does the upload return a transaction hash?
6. [ ] **Verification**: Can verify the uploaded document immediately?
