plugins {
  java
  checkstyle
  id("org.springframework.boot") version "4.0.6"
  id("io.spring.dependency-management") version "1.1.7"
  id("pmd")
  id("jacoco")
//  id("com.github.spotbugs' version '6.5.1")
//  id("org.sonarqube' version '7.3.0.8198")
}

group = "org.example"
version = "0.0.1-SNAPSHOT"
description = "Spring-Quality"

java {
  toolchain {
    languageVersion = JavaLanguageVersion.of(21)
  }
}

repositories {
  mavenCentral()
}

dependencies {
  implementation("org.springframework.boot:spring-boot-starter-webmvc")
  implementation("org.mybatis.spring.boot:mybatis-spring-boot-starter:4.0.1")
  compileOnly("org.projectlombok:lombok")
  runtimeOnly("org.postgresql:postgresql")
  annotationProcessor("org.projectlombok:lombok")
  testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
  testImplementation("org.mybatis.spring.boot:mybatis-spring-boot-starter-test:4.0.1")
  testCompileOnly("org.projectlombok:lombok")
  testRuntimeOnly("org.junit.platform:junit-platform-launcher")
  testAnnotationProcessor("org.projectlombok:lombok")
}

checkstyle {
  toolVersion = "13.4.2"
  configFile = file("$rootDir/config/checkstyle/checkstyle.xml")
  isIgnoreFailures = false
}

tasks.withType<Checkstyle>().configureEach {
  javaLauncher = javaToolchains.launcherFor {
    languageVersion = JavaLanguageVersion.of(21)
  }

  reports {
    xml.required.set(true)
    html.required.set(true)
  }

  minHeapSize = "200m"
  maxHeapSize = "1g"
}

tasks.withType<Test> {
  useJUnitPlatform()
}
