/**
 * global.d.ts — Global type declarations for third-party modules
 * that don't ship their own TypeScript definitions.
 */

// react-native-vector-icons
declare module 'react-native-vector-icons' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle, ImageStyle } from 'react-native';

  interface IconProps {
    name: string;
    color?: string;
    size?: number;
    style?: TextStyle | ViewStyle | ImageStyle | Array<TextStyle | ViewStyle | ImageStyle>;
  }

  export class Icon extends Component<IconProps> {}
  export class Ionicons extends Component<IconProps> {}
  export class MaterialIcons extends Component<IconProps> {}
  export class FontAwesome extends Component<IconProps> {}
  export class FontAwesome5 extends Component<IconProps> {}
  export class MaterialCommunityIcons extends Component<IconProps> {}

  export const iconMap: Record<string, object>;
  export function getImageSource(name: string, size?: number): Promise<number>;
  export function loadFont(fontFamily: string, fontFile: string): Promise<void>;
  export function getFileIconSource(iconName: string, iconColor?: string, iconSize?: number): Promise<number>;
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle, ImageStyle } from 'react-native';
  export default class Ionicons extends Component<{
    name: string;
    color?: string;
    size?: number;
    style?: TextStyle | ViewStyle | ImageStyle;
  }> {}
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  export default class MaterialIcons extends Component<{
    name: string;
    color?: string;
    size?: number;
  }> {}
}

// react-native-image-viewing (used by ChatRoomScreen)
declare module 'react-native-image-viewing' {
  import { Component } from 'react';
  interface ImageViewingProps {
    images: Array<{ uri: string }>;
    imageIndex: number;
    visible: boolean;
    onRequestClose: () => void;
  }
  const ImageViewing: React.FC<ImageViewingProps>;
  export default ImageViewing;
}

// libsodium-wrappers
declare module 'libsodium-wrappers' {
  export const ready: Promise<void>;
  export function crypto_aead_xchacha20poly1305_ietf_encrypt(
    message: Uint8Array,
    additionalData: Uint8Array | null,
    secretNonce: Uint8Array,
    secretKey: Uint8Array,
  ): Uint8Array;
  export function crypto_aead_xchacha20poly1305_ietf_decrypt(
    ciphertext: Uint8Array,
    additionalData: Uint8Array | null,
    secretNonce: Uint8Array,
    secretKey: Uint8Array,
  ): Uint8Array | null;
  export function crypto_box_keypair(): {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  };
  export function crypto_scalarmult_base(publicKey: Uint8Array): Uint8Array;
  export function crypto_generichash(
    message: Uint8Array,
    key?: Uint8Array,
    outLen?: number,
  ): Uint8Array;
  export function randombytes_buf(length: number): Uint8Array;
  export function to_hex(data: Uint8Array): string;
  export function from_hex(hex: string): Uint8Array;
  export function memzero(data: Uint8Array): void;
  export function crypto_kdf_derive_from_key(
    subkeyLen: number,
    subkeyId: number,
    context: string,
    key: Uint8Array,
  ): Uint8Array;
}

// NodeJS types used in some screens
declare namespace NodeJS {
  type Timeout = ReturnType<typeof setTimeout>;
}

// StyleSheet.absoluteFillObject compatibility
// (Some screens use RN 0.72+ API which differs from 0.85)
declare module 'react-native' {
  interface StyleSheetStatic {
    absoluteFillObject: {
      position: 'absolute';
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    };
  }
}
