# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy project file and restore
COPY BlogApi.csproj ./
RUN dotnet restore BlogApi.csproj

# Copy remaining source code (frontend excluded via .dockerignore)
COPY . ./
RUN dotnet publish BlogApi.csproj -c Release -o /app/out /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./

# Render assigns port 10000 by default (or PORT environment variable)
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "BlogApi.dll"]
