
const domain = process.env.GROONA_DOMAIN || "www.YOUR_DOMAIN.kr";
const appleTeam = process.env.APPLE_TEAM_ID || "YOUR_APPLE_TEAM_ID";
module.exports = {
  expo: {
    name: "GROONA",
    slug: "groona",
    version: "4.0.0",
    scheme: "groona",
    orientation: "portrait",
    userInterfaceStyle: "automatic",   // 앱 내 테마 설정의 "시스템" 모드가 기기 설정을 따르려면 automatic 이어야 한다
    ios: {
      bundleIdentifier: "kr.co.groona.app",
      supportsTablet: true,
      associatedDomains: [`applinks:${domain}`],
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "가까운 지역 학습·체험 프로그램을 추천하기 위해 현재 위치를 사용합니다.",
        NSCalendarsUsageDescription: "선택한 프로그램 일정을 기기 캘린더에 추가하기 위해 캘린더에 접근합니다.",
        NSCalendarsFullAccessUsageDescription: "선택한 프로그램 일정을 기기 캘린더에 추가하기 위해 캘린더에 접근합니다."
      }
    },
    android: {
      package: "kr.co.groona.app",
      permissions: ["ACCESS_COARSE_LOCATION","ACCESS_FINE_LOCATION","POST_NOTIFICATIONS","READ_CALENDAR","WRITE_CALENDAR"],
      intentFilters: [{
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: domain, pathPrefix: "/activity" },
          { scheme: "https", host: domain, pathPrefix: "/app" }
        ],
        category: ["BROWSABLE","DEFAULT"]
      }]
    },
    plugins: [
      "expo-router",
      ["expo-location",{locationWhenInUsePermission:"가까운 지역 학습·체험 프로그램을 추천하기 위해 현재 위치를 사용합니다."}],
      ["expo-notifications",{defaultChannel:"groona-recommendations"}],
      "expo-secure-store",
      ["expo-calendar",{calendarPermission:"선택한 프로그램 일정을 기기 캘린더에 추가하기 위해 캘린더에 접근합니다."}]
    ],
    extra: {
      router: { origin: `https://${domain}` },
      eas: { projectId: process.env.EXPO_PROJECT_ID || "YOUR_EXPO_PROJECT_ID" }
    }
  }
};
