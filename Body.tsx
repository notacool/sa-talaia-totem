import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { HomeView } from "./src/HomeView";

const style = StyleSheet.create({
    globalView: {
      display: 'flex',
      height: '100%',
      flexDirection: 'column',
      gap: 8,
    },
    privateContentView: {
      padding: 24,
      paddingBottom: 0,
    },
  });

function Body(): JSX.Element {
  return <SafeAreaView style={style.globalView}>
        <HomeView></HomeView>
  </SafeAreaView>;
}

export default Body;