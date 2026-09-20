"use client";
import{useLayoutEffect}from"react";
import{readTheme,setTheme}from"./cup";
// The effect must return nothing — returning setTheme()'s value tripped React's
// "useLayoutEffect must not return anything besides a function" warning (the
// red "1 Issue" dev badge on the match screen).
export default function ThemeBootstrap(){useLayoutEffect(()=>{setTheme(readTheme());},[]);return null}
