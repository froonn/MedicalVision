## How to launch:
- Clone repository
```bash
git clone https://github.com/froonn/MedicalVision.git
cd MedicalVision
```

### Using docker and docker-compose:

Build docker containers.
```bash
docker compose build
```

> [!NOTE]
> The first time after building containers, the project may fail to launch. You should launch it, wait 10-15 seconds, and then restart the project. Subsequent launches should be trouble-free.

```bash
docker compose up
```

> [!NOTE]
> Login details for the admin account:
> login: `admin`
> passwd: `password`