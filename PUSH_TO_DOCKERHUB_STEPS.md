# 🚀 Push Image to Docker Hub - Quick Steps

## Your Docker Hub Username
**hariharan11111**

## Step 1: Login to Docker Hub

Open PowerShell or Command Prompt and run:

```bash
docker login
```

Enter your Docker Hub credentials when prompted:
- Username: `hariharan11111`
- Password: (your Docker Hub password)

## Step 2: Push the Image

After successful login, run:

```bash
cd G:\Dev\focusrobinsite
docker push hariharan11111/focusrobin-app:latest
```

This will upload the 610MB image to Docker Hub. It may take a few minutes.

## Step 3: Verify on Docker Hub

Visit: https://hub.docker.com/u/hariharan11111

You should see the `focusrobin-app` repository after the push completes.

---

## ✅ After Push Completes

Once the image is pushed, you can:
1. Deploy on VPS using the docker-compose file
2. The image will be pulled from: `hariharan11111/focusrobin-app:latest`

---

**Note:** The image is already tagged and ready. Just login and push!








