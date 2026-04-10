# Use a lightweight Java 21 image
FROM eclipse-temurin:21-jdk-alpine

# Set the working directory
WORKDIR /app

# Copy the maven wrapper and pom file
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Grant execution permission to the maven wrapper
RUN chmod +x ./mvnw

# Copy the source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# Run the jar file
CMD ["java", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"]
