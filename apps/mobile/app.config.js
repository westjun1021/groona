
const domain = process.env.GROONA_DOMAIN || "www.YOUR_DOMAIN.kr";
const appleTeam = process.env.APPLE_TEAM_ID || "YOUR_APPLE_TEAM_ID";
module.exports = {
  expo: {
    name: "GROONA",
    slug: "groona",
    version: "4.0.0",
    scheme: "groona",
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "kr.co.groona.app",
      supportsTablet: true,
      associatedDomains: [`applinks:${domain}`],
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "가까운 지역 학습·체험 프로그램을 추천하기 위해 현재 위치를 사용합니다."
      }
    },
    android: {
      package: "kr.co.groona.app",
      permissions: ["ACCESS_COARSE_LOCATION","ACCESS_FINE_LOCATION","POST_NOTIFICATIONS"],
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
      "expo-secure-store"
    ],
    extra: {
      router: { origin: `https://${domain}` },
      eas: { projectId: process.env.EXPO_PROJECT_ID || "YOUR_EXPO_PROJECT_ID" }
    }
  }
};
