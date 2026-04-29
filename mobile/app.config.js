import 'dotenv/config';

const { withAppBuildGradle } = require('@expo/config-plugins');

// Bezpieczna wtyczka: dokleja kod na końcu pliku, omijając problemy z wyszukiwaniem
const withDesugaring = (config) => {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    const fixesBlock = `
// --- DODANE PRZEZ WTYCZKĘ (DESUGARING & DUPLICATES FIX) ---
android {
    compileOptions {
        coreLibraryDesugaringEnabled true
    }
}
dependencies {
    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs_nio:2.0.4'
}
// Rozwiązanie problemu Duplicate class:
configurations.all {
    exclude group: 'com.google.android.gms', module: 'play-services-maps'
}
// ----------------------------------------
`;
    // Jeśli jeszcze tego nie ma, doklejamy na samym dole
    if (!buildGradle.includes('coreLibraryDesugaringEnabled')) {
      buildGradle += fixesBlock;
    }

    config.modResults.contents = buildGradle;
    return config;
  });
};

export default {
  expo: {
    name: "Taxi Michelin",
    slug: "taxi-michelin-app",
    version: "1.0.0",
    icon: "./assets/icon.png",
    android: {
      package: "com.michelin.taxi.driver",
      
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff" 
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "FOREGROUND_SERVICE",
        "ACCESS_LOCATION_EXTRA_COMMANDS"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
    },

    plugins: [
      "expo-location",
      "expo-font",
      withDesugaring, // Nasza nowa, kuloodporna wtyczka
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24, 
            "enableMultiDex": true,
            "extraMavenRepos": [
              "https://maven.google.com"
            ]
          }
        }
      ]
    ],

    extra: {
      eas: {
        projectId: "8b9facd4-5ab7-4291-984a-0257cc6f4d6b"
      }
    }
  }
};