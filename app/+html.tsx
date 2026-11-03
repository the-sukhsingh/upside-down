import { ScrollViewStyleReset } from 'expo-router/html';
import { StyleSheet } from 'react-native';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Inject react-native-web atomic stylesheet to ensure all styles apply properly on web */}
        <style
          id="react-native-stylesheet"
          dangerouslySetInnerHTML={{
            __html: (StyleSheet as any).getSheet().textContent,
          }}
        />

        {/* Global CSS styles and dark-mode overrides */}
        <style dangerouslySetInnerHTML={{ __html: globalWebStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalWebStyles = `
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
#root {
  display: flex;
  flex-direction: column;
}
body {
  background-color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}
`;
