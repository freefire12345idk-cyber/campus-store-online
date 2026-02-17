@echo off
echo 🔧 Starting database synchronization...
echo.

REM Load environment variables
for /f "tokens=1,2,* delims==" %%i in (%*) do (
    set "%%i"
)

REM Show DATABASE_URL (masked)
if defined DATABASE_URL (
    echo 📊 DATABASE_URL: %DATABASE_URL:~0,19%...
) else (
    echo ❌ DATABASE_URL not set!
    goto :error
)

REM Generate Prisma client
echo 📦 Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Prisma generation failed
    goto :error
)

REM Push schema to database
echo 🗄️ Pushing schema to database...
npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo ❌ Database push failed
    goto :error
)

echo ✅ Database synchronization completed!
goto :end

:error
echo ❌ Operation failed!
exit /b 1

:end
echo 🎉 Setup complete!
pause
