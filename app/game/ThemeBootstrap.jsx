"use client";
import{useLayoutEffect}from"react";
import{readTheme,setTheme}from"./cup";
export default function ThemeBootstrap(){useLayoutEffect(()=>setTheme(readTheme()),[]);return null}
