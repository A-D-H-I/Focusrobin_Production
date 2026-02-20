# 🚀 Push Docker Image to Docker Hub

## Step 1: Login to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password when prompted.

**Or login with username directly:**
```bash
docker login -u YOUR_DOCKERHUB_USERNAME
```

---

## Step 2: Tag the Image

Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username:

```bash
docker tag focusrobin/app:latest YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest
```

**Example:**
```bash
docker tag focusrobin/app:latest hariharan/focusrobin-app:latest
```

---

## Step 3: Push to Docker Hub

```bash
docker push YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest
```

**Example:**
```bash
docker push hariharan/focusrobin-app:latest
```

---

## Step 4: Verify on Docker Hub

1. Go to https://hub.docker.com
2. Login to your account
3. Check your repositories
4. You should see `focusrobin-app` repository

---

## ✅ After Pushing

Once the image is pushed, update the `docker-compose.vps.yml` file on your VPS with your Docker Hub username, then you can pull and deploy!










