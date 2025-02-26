import { SlideItem } from "@/components/conversations/SlideItem";
import React from "react";
import { ImageStyle, StyleProp } from "react-native";
import { CarouselRenderItem } from "react-native-reanimated-carousel";

interface Options {
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
  imagesArray?: any;
}

export const renderItem =
  ({ rounded = false, style, imagesArray }: Options = {}): CarouselRenderItem<any> =>
  ({ index }: { index: number }) => (
    <SlideItem key={index} index={index} rounded={rounded} style={style} imagesArray={imagesArray} />
  );