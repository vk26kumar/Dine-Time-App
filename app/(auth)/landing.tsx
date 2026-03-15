// app/(auth)/landing.tsx
// ─── DineTime Landing · Refined Warm Theme ────────────────────────────────────
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8F2",
  bgMid: "#FFF2E6",
  ember: "#F06020",
  emberLight: "#FF8C42",
  emberBright: "#FFB347",
  textPrimary: "#1A0800",
  textSub: "rgba(60,25,5,0.5)",
  textMuted: "rgba(60,25,5,0.32)",
  textBrand: "rgba(233,90,10,0.45)",
  white: "#FFFFFF",
};

const FEATURES = [
  {
    icon: "search" as const,
    label: "Explore Restaurants",
    sub: "200+ venues nearby",
  },
  {
    icon: "event" as const,
    label: "Instant Booking",
    sub: "Reserve in seconds",
  },
  {
    icon: "local-offer" as const,
    label: "Exclusive Deals",
    sub: "Members-only offers",
  },
];

// ─── Sonar rings ──────────────────────────────────────────────────────────────
const SONAR_D = 88;

function SonarRing({
  delay,
  initOp = 0.55,
}: {
  delay: number;
  initOp?: number;
}) {
  const sc = useRef(new Animated.Value(1)).current;
  const op = useRef(new Animated.Value(initOp)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(sc, {
            toValue: 1.85,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(op, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(sc, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(op, {
            toValue: initOp,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: SONAR_D,
        height: SONAR_D,
        borderRadius: SONAR_D / 2,
        borderWidth: 1.5,
        borderColor: "rgba(240,96,32,0.55)",
        opacity: op,
        transform: [{ scale: sc }],
      }}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ─── Animated values ──────────────────────────────────────────────────────
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoSc = useRef(new Animated.Value(0.82)).current;

  const brandOp = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(12)).current;

  const tagOp = useRef(new Animated.Value(0)).current;
  const divOp = useRef(new Animated.Value(0)).current;

  const headOp = useRef(new Animated.Value(0)).current;
  const headY = useRef(new Animated.Value(10)).current;

  const subOp = useRef(new Animated.Value(0)).current;

  // One animated value per feature card
  const cardAnims = useRef(
    FEATURES.map(() => ({
      op: new Animated.Value(0),
      x: new Animated.Value(18),
    })),
  ).current;

  const ctaOp = useRef(new Animated.Value(0)).current;
  const ctaSc = useRef(new Animated.Value(0.88)).current;
  const btnSc = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    // ── Staggered entrance sequence ─────────────────────────────────────────

    // 1 — Logo materialises
    const logoAnim = Animated.parallel([
      Animated.timing(logoOp, {
        toValue: 1,
        duration: 420,
        easing: ease,
        useNativeDriver: true,
      }),
      Animated.timing(logoSc, {
        toValue: 1,
        duration: 420,
        easing: ease,
        useNativeDriver: true,
      }),
    ]);

    // 2 — Brand name drifts up
    const brandAnim = Animated.sequence([
      Animated.delay(60),
      Animated.parallel([
        Animated.timing(brandOp, {
          toValue: 1,
          duration: 340,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 340,
          easing: ease,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // 3 — Tagline, divider, headline, subtitle fade in together
    const middleAnim = Animated.sequence([
      Animated.delay(40),
      Animated.parallel([
        Animated.timing(tagOp, {
          toValue: 1,
          duration: 280,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(divOp, {
          toValue: 1,
          duration: 280,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(headOp, {
          toValue: 1,
          duration: 300,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(headY, {
          toValue: 0,
          duration: 300,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(subOp, {
          toValue: 1,
          duration: 300,
          easing: ease,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // 4 — Cards cascade in with 60 ms stagger
    const cardsAnim = Animated.stagger(
      60,
      cardAnims.map(({ op, x }) =>
        Animated.parallel([
          Animated.timing(op, {
            toValue: 1,
            duration: 300,
            easing: ease,
            useNativeDriver: true,
          }),
          Animated.timing(x, {
            toValue: 0,
            duration: 300,
            easing: ease,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    // 5 — CTA springs in last with overshoot
    const ctaAnim = Animated.sequence([
      Animated.delay(40),
      Animated.parallel([
        Animated.timing(ctaOp, {
          toValue: 1,
          duration: 320,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(ctaSc, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Run full sequence
    Animated.sequence([
      logoAnim,
      brandAnim,
      middleAnim,
      cardsAnim,
      ctaAnim,
    ]).start();

    // Gentle button breathe — starts after everything has landed
    Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(btnSc, {
          toValue: 1.02,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(btnSc, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={st.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={[C.bg, C.bgMid, "#FFEEDA"]}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={st.glowTop} />
      <View pointerEvents="none" style={st.glowBottom} />

      <View
        style={[
          st.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* LOGO HERO */}
        <Animated.View
          style={[
            st.heroWrap,
            {
              opacity: logoOp,
              transform: [{ scale: logoSc }],
            },
          ]}
        >
          <SonarRing delay={0} initOp={0.55} />
          <SonarRing delay={600} initOp={0.4} />
          <SonarRing delay={1200} initOp={0.25} />
          <Image
            source={require("../../assets/DTime.png")}
            style={st.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* BRAND NAME */}
        <Animated.View
          style={[
            st.brandRow,
            {
              opacity: brandOp,
              transform: [{ translateY: brandY }],
            },
          ]}
        >
          <Text style={st.brandDine}>Dine</Text>
          <Text style={st.brandTime}>Time</Text>
        </Animated.View>

        {/* TAGLINE */}
        <Animated.Text style={[st.tagline, { opacity: tagOp }]}>
          BOOK · DINE · REPEAT
        </Animated.Text>

        {/* DIVIDER */}
        <Animated.View style={[st.divRow, { opacity: divOp }]}>
          <View style={st.divLine} />
          <MaterialIcons name="local-dining" size={14} color={C.ember} />
          <View style={st.divLine} />
        </Animated.View>

        {/* HEADLINE */}
        <Animated.View
          style={[
            st.headlineWrap,
            {
              opacity: headOp,
              transform: [{ translateY: headY }],
            },
          ]}
        >
          <Text style={st.eyebrow}>YOUR NEXT RESERVATION AWAITS</Text>
          <Text style={st.title}>Find Your{"\n"}Perfect Table</Text>
        </Animated.View>

        {/* SUBTITLE */}
        <Animated.Text style={[st.sub, { opacity: subOp }]}>
          Discover top restaurants, book instantly,{"\n"}and enjoy exclusive
          dining deals.
        </Animated.Text>

        {/* FEATURE CARDS — cascade in one by one */}
        <View style={st.cards}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={i}
              style={[
                st.card,
                {
                  opacity: cardAnims[i].op,
                  transform: [{ translateX: cardAnims[i].x }],
                },
              ]}
            >
              <LinearGradient
                colors={[C.ember, C.emberLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={st.cardBar}
              />
              <View style={st.cardIcon}>
                <MaterialIcons name={f.icon} size={15} color={C.ember} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.cardTitle}>{f.label}</Text>
                <Text style={st.cardSub}>{f.sub}</Text>
              </View>
              <View style={st.statusDot} />
            </Animated.View>
          ))}
        </View>

        {/* Push CTA to bottom */}
        <View style={{ flex: 1 }} />

        {/* CTA — springs in last */}
        <Animated.View
          style={[
            st.ctaWrap,
            {
              opacity: ctaOp,
              transform: [{ scale: ctaSc }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            activeOpacity={0.82}
            style={st.btnOuter}
          >
            <Animated.View style={{ transform: [{ scale: btnSc }] }}>
              <LinearGradient
                colors={["#FF5A5F", "#FF7A2F", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.btn}
              >
                <Text style={st.btnLabel}>Get Started</Text>
                <View style={st.btnChevron}>
                  <MaterialIcons
                    name="arrow-forward"
                    size={15}
                    color="#FF6B35"
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <Text style={st.footer}>
            By continuing, you agree to our{" "}
            <Text style={st.footerLink}>Terms</Text>
            {" & "}
            <Text style={st.footerLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1 },

  glowTop: {
    position: "absolute",
    width: SW * 0.4,
    height: SW * 0.4,
    borderRadius: SW * 0.2,
    backgroundColor: "rgba(233,90,10,0.032)",
    top: -SW * 0.3,
    right: -SW * 0.12,
  },
  glowBottom: {
    position: "absolute",
    width: SW * 0.65,
    height: SW * 0.65,
    borderRadius: SW * 0.325,
    backgroundColor: "rgba(255,140,40,0.032)",
    bottom: -SW * 0.28,
    left: -SW * 0.2,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  // Hero
  heroWrap: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  logo: { width: 88, height: 88 },

  // Brand
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
  },
  brandDine: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1C0A00",
    letterSpacing: -1.2,
  },
  brandTime: {
    fontSize: 34,
    fontWeight: "900",
    color: C.ember,
    letterSpacing: -1.2,
  },
  tagline: {
    fontSize: 9.5,
    fontWeight: "800",
    color: C.textBrand,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 18,
  },

  // Divider
  divRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
    marginBottom: 14,
  },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(233,90,10,0.15)" },

  // Headline
  headlineWrap: { alignSelf: "stretch", marginBottom: 10 },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: "800",
    color: C.ember,
    letterSpacing: 2.2,
    marginBottom: 7,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: C.textPrimary,
    letterSpacing: -1.4,
    lineHeight: 48,
  },
  sub: {
    fontSize: 14,
    color: C.textSub,
    lineHeight: 22,
    marginBottom: 20,
    alignSelf: "stretch",
  },

  // Feature cards
  cards: {
    gap: 9,
    alignSelf: "stretch",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(240,96,32,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(233,90,10,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: "hidden",
  },
  cardBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(240,96,32,0.12)",
    borderWidth: 1,
    borderColor: "rgba(240,96,32,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 2,
  },
  cardSub: { fontSize: 11, color: C.textSub },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.emberLight,
    opacity: 0.7,
  },

  // CTA
  ctaWrap: { alignSelf: "stretch" },
  btnOuter: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
    borderRadius: 16,
  },
  btnChevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  btnLabel: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    fontSize: 11,
    color: "rgba(60,25,5,0.32)",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 10,
  },
  footerLink: { color: "rgba(233,90,10,0.55)", fontWeight: "600" },
});
