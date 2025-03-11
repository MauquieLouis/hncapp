import { SlideItem } from "@/components/conversations/SlideItem";
import React from "react";
import { ImageStyle, StyleProp } from "react-native";
import { CarouselRenderItem } from "react-native-reanimated-carousel";

interface Options {
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
  imagesArray?: any;
  openModalFunction?: Function;
  attachments?: any;
  resizeMode?: string;
  modalOpen?: boolean;
  actionSheetTable?: object;
}

export const renderItem =
  ({ rounded = false, style, imagesArray, openModalFunction, attachments, resizeMode, modalOpen, actionSheetTable }: Options = {}): CarouselRenderItem<any> =>
  ({ index }: { index: number }) => (
      <SlideItem 
        key={index} 
        index={index} 
        rounded={rounded} 
        style={style} 
        imagesArray={imagesArray} 
        openModal={openModalFunction} 
        attachments={attachments} 
        resizeMode={resizeMode}
        modalOpen={modalOpen}
        actionSheetTable={actionSheetTable}/>
  );