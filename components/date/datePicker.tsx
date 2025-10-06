import { Button } from "../ui/button";
import { VStack } from "../ui/vstack";
import { HStack } from "../ui/hstack";
import { Pressable } from "../ui/pressable";

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

export default function CustomDatePicker({
  onDateChange,
}: {
  onDateChange?: (date: Date) => void;
}) {
  const currentYear = new Date().getFullYear();

  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(currentYear - 18);

  const [days, setDays] = useState<number[]>([]);
  const itemHeight = 48; // hauteur d’un item
  const visibleCount = 4; // nombre visible d’items (affichera un élément centré)

  const dayRef = useRef<ScrollView>(null);
  const monthRef = useRef<ScrollView>(null);
  const yearRef = useRef<ScrollView>(null);

  const months = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
  ];

  const years = Array.from({ length: currentYear - 1925 + 1 }, (_, i) => 1925 + i);

  // 🧮 Adapter les jours selon le mois et l'année
  useEffect(() => {
    const scrollToInitial = () => {
    const itemHeight = 48;
    // Scroll jusqu’à la valeur initiale pour chaque picker
    dayRef.current?.scrollTo({ y: (selectedDay - 1) * itemHeight, animated: false });
    monthRef.current?.scrollTo({ y: selectedMonth * itemHeight, animated: false });

    const yearIndex = years.findIndex((y) => y === selectedYear);
    if (yearIndex !== -1) {
      yearRef.current?.scrollTo({ y: yearIndex * itemHeight, animated: false });
    }
  };

  // petit délai pour attendre le rendu du ScrollView
  setTimeout(scrollToInitial, 100);
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    setDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
  }, [selectedMonth, selectedYear]);

  // 🔁 Met à jour la date complète
  useEffect(() => {
    console.log("DATE CHANGED")
    onDateChange?.(new Date(selectedYear, selectedMonth, selectedDay));
  }, [selectedDay, selectedMonth, selectedYear]);

  // 🌀 Fonction pour détecter l'élément centré
  const handleScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
    type: "day" | "month" | "year"
  ) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);

    if (type === "day") setSelectedDay(days[index]);
    if (type === "month") setSelectedMonth(index);
    if (type === "year") setSelectedYear(years[index]);
  };

  const renderScroll = (
    data: any[],
    selected: any,
    setSelected: (val: any) => void,
    ref: any,
    type: "day" | "month" | "year"
  ) => (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      snapToInterval={itemHeight}
      decelerationRate="fast"
      contentContainerStyle={{
        paddingVertical: (itemHeight * (visibleCount - 1)) / 2,
      }}
      onMomentumScrollEnd={(e) => handleScrollEnd(e, type)}
      style={styles.scroll}
    >
      {data.map((item, i) => {
        const isSelected = 
          (type === "day" && item === selectedDay) ||
          (type === "month" && i === selectedMonth) ||
          (type === "year" && item === selectedYear);

        return (
          <View key={item} style={[styles.option, isSelected && styles.selectedOption]}>
            <Text style={[styles.text, isSelected && styles.selectedText]}>
              {item}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <VStack alignItems="center" space="lg" mt="$6">
      <Text style={styles.title}>Date de naissance</Text>

      <View style={styles.frame}>
        {/* Lignes de sélection */}
        <View style={styles.selectionLineTop} />
        <View style={styles.selectionLineBottom} />

        <HStack justifyContent="center" space="sm">
          {renderScroll(days, selectedDay, setSelectedDay, dayRef, "day")}
          {renderScroll(months, selectedMonth, setSelectedMonth, monthRef, "month")}
          {renderScroll(years, selectedYear, setSelectedYear, yearRef, "year")}
        </HStack>
      </View>

      {/* <Button
        mt="$4"
        bg="#4c1d95"
        borderRadius="$xl"
        onPress={() =>
          onDateChange?.(new Date(selectedYear, selectedMonth, selectedDay))
        }
      >
        <Text style={styles.buttonText}>Confirmer</Text>
      </Button> */}
    </VStack>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4c1d95",
    marginBottom: 8,
  },
  frame: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 8,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionLineTop: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "#4c1d95",
    opacity: 0.2,
  },
  selectionLineBottom: {
    position: "absolute",
    bottom: "40%",
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "#4c1d95",
    opacity: 0.2,
  },
  scroll: {
    height: 200,
    width: 80,
  },
  option: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedOption: {},
  text: {
    fontSize: 16,
    color: "#666",
  },
  selectedText: {
    color: "#4c1d95",
    fontWeight: "700",
    fontSize: 18,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});

