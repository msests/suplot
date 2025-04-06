import { ColorBase, PureColor } from "../Misc/Color";
import { Tensor } from "../Misc/Tensor";
import { Text } from "../Scene2D/Text";

/**
 * Interface representing information about a rendered glyph
 *
 * Contains positioning and dimension data for a single character
 */
interface GlyphInfo {
  /** The texture group this glyph belongs to, based on font size */
  group: number;
  /** X position of the glyph in the texture atlas */
  x: number;
  /** Y position of the glyph in the texture atlas */
  y: number;
  /** Width of the glyph in pixels */
  width: number;
  /** Height of the glyph in pixels */
  height: number;
  /** Horizontal offset to apply when rendering */
  xoffset: number;
  /** Vertical offset to apply when rendering */
  yoffset: number;
  /** Horizontal distance to advance after rendering this glyph */
  xadvance: number;
}

/**
 * Class for handling font decorations like bold styles
 *
 * Provides a way to uniquely identify different font styles
 */
class CharDecorator {
  /**
   * Creates a new character decorator
   *
   * @param font - Font family name
   * @param bold - Whether the font should be bold
   */
  constructor(public font: string, public bold: boolean) {}

  /**
   * Converts the decorator to a unique string representation
   *
   * @returns A string that uniquely identifies this font style
   */
  toString(): string {
    return `${this.font} ${this.bold ? "b" : "n"}`;
  }
}

/**
 * Cache for storing rendered font glyphs
 *
 * Optimizes text rendering by reusing previously rendered characters
 */
class FontGlyphCache {
  // Map<char-code, Map<decorator-str, glyph-info>>
  private cache: Map<number, Map<string, GlyphInfo>> = new Map();

  /**
   * Gets or creates a map for a specific character code
   *
   * @param char - The character code to look up
   * @returns A map of decorators to glyph info for this character
   */
  private getCharMap(char: number) {
    if (!this.cache.has(char)) {
      this.cache.set(char, new Map());
    }
    return this.cache.get(char)!;
  }

  /**
   * Retrieves a cached glyph for a character with a specific style
   *
   * @param char - The character to look up
   * @param decorator - The font style decorator
   * @returns The glyph information if found, undefined otherwise
   */
  public getGlyph(
    char: string,
    decorator: CharDecorator
  ): GlyphInfo | undefined {
    const charMap = this.getCharMap(char.charCodeAt(0));
    return charMap.get(decorator.toString());
  }

  /**
   * Stores a glyph in the cache
   *
   * @param char - The character to cache
   * @param decorator - The font style decorator
   * @param glyphInfo - The glyph information to store
   */
  public setGlyph(
    char: string,
    decorator: CharDecorator,
    glyphInfo: GlyphInfo
  ): void {
    const charMap = this.getCharMap(char.charCodeAt(0));
    charMap.set(decorator.toString(), glyphInfo);
  }
}

/**
 * Canvas used for rendering text glyphs
 *
 * Handles drawing characters to an offscreen canvas for later use in texture atlases
 */
class BackendCanvas {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private x: number = 0;
  private y: number = 0;

  /**
   * Creates a new backend canvas
   *
   * @param size - Font size in pixels
   * @param width - Width of the canvas in pixels
   * @param height - Height of the canvas in pixels
   */
  constructor(private size: number, width: number, height: number) {
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext("2d")!;
  }

  /**
   * Configures the canvas for text rendering
   *
   * @param font - Font family name to use
   */
  public config(font: string): void {
    this.ctx.font = `${this.size}px ${font}`;
    this.ctx.textBaseline = "top";
    this.ctx.textAlign = "left";
  }

  /**
   * Draws a character to the canvas and returns its glyph information
   *
   * @param char - The character to draw
   * @returns Information about the rendered glyph
   */
  public drawChar(char: string): GlyphInfo {
    const metrics = this.ctx.measureText(char);
    const width = Math.ceil(metrics.width);
    const height = parseInt(this.ctx.font); // Estimate height based on font size

    if (this.x + width > this.canvas.width) {
      this.x = 0;
      this.y += height;
    }

    const x = this.x;
    const y = this.y;

    this.ctx.fillStyle = "white"; // Set text color to black
    this.ctx.fillText(char, x, y);

    this.x += width;

    return {
      group: this.size / 32 - 1,
      x: x,
      y: y,
      width: width,
      height: height,
      xoffset: 0,
      yoffset: 0,
      xadvance: width,
    };
  }

  /**
   * Gets the canvas content as an ImageBitmap for texture creation
   *
   * @returns The canvas content as an ImageBitmap
   */
  public getData() {
    return this.canvas.transferToImageBitmap();
  }

  /**
   * Gets the underlying OffscreenCanvas
   *
   * @returns The OffscreenCanvas instance
   */
  public get Canvas(): OffscreenCanvas {
    return this.canvas;
  }
}

/**
 * Interface defining input for text shaders
 *
 * Contains all data needed to render a text vertex
 */
export interface TextShaderInput {
  /** Position of the vertex in 3D space [x, y, z, w] */
  position: number[];
  /** Texture coordinates [u, v] */
  texCoord: number[];
  /** Texture array layer/index */
  texLayer: number;
  /** RGBA color values */
  color: number[];
}

/**
 * Class for efficiently rendering text using WebGPU
 *
 * Handles text atlas generation, caching, and geometry creation.
 * Text rendering is complicated so this class is designed to be efficient.
 */
export class TextRenderer {
  private device: GPUDevice;
  private sampler: GPUSampler | null = null;

  // tempCanvas[0]: 0 < font_size <= 32
  // tempCanvas[1]: 32 < font_size <= 64
  // tempCanvas[2]: 64 < font_size <= 96
  // tempCanvas[3]: 96 < font_size <= 128
  private tempCanvas: BackendCanvas[] = [];

  // Cache for font glyphs
  // Each index corresponds to a font size range
  private fontCache: FontGlyphCache[] = [];

  /**
   * Creates a new TextRenderer
   *
   * @param device - The WebGPU device to use for rendering
   */
  constructor(device: GPUDevice) {
    this.device = device;
  }

  /**
   * Adds a character to the appropriate text atlas
   *
   * @param options - Configuration options for the character
   * @param options.char - The character to add
   * @param options.font - Font family to use (default: 'Arial')
   * @param options.size - Font size in pixels (default: 16)
   * @param options.color - Text color (default: black)
   * @param options.box - Bounding box [x, y, width, height]
   * @returns Information about the rendered glyph if successful
   */
  public addChar(options: {
    char: string;
    font?: string;
    size?: number;
    color?: ColorBase;
    box?: [number, number, number, number];
  }): GlyphInfo | undefined {
    let { char, font, size, color, box } = options;
    font = font || "Arial";
    size = size || 16; // Default font size
    color = color || new PureColor([0, 0, 0, 1]);

    // Check if the font is already loaded
    const sizeGroup = Math.floor(size / 32);

    const fontDecorator = new CharDecorator(font, false);
    const fontCache = this.fontCache[sizeGroup];

    // Check if the glyph is already cached
    const cachedGlyph = fontCache.getGlyph(char, fontDecorator);
    if (cachedGlyph) {
      // Return the cached glyph
      return cachedGlyph;
    }

    const canvas = this.tempCanvas[sizeGroup];
    canvas.config(font);
    const glyphInfo = canvas.drawChar(char);
    fontCache.setGlyph(char, fontDecorator, glyphInfo);

    return glyphInfo;
  }

  //   private toWorldSize(size: ISize): number {
  //     return typeof size === "number" ? size : parseFloat(size) * this.onePixel;
  //   }

  /**
   * Creates geometry for rendering text
   *
   * @param options - Text rendering options
   * @param onePixel - Conversion factor from world units to pixels
   * @returns Object containing vertex data and indices for rendering
   */
  public createTextGeometry(
    text: Text,
    onePixel: number
  ): {
    vertexes: TextShaderInput[];
    indices: number[];
  } {
    const size = text.Size as number;
    const sizeApproxInPixel = Math.ceil(size / onePixel);
    const glyphs: GlyphInfo[] = [];
    for (const char of text.Content) {
      const glyph = this.addChar({
        char,
        font: text.Font,
        size: sizeApproxInPixel,
      });
      if (glyph) {
        glyphs.push(glyph);
      }
    }

    const ratio = sizeApproxInPixel / ((glyphs[0].group + 1) * 32);

    // Create geometry based on glyphs
    const vertexes: TextShaderInput[] = [];
    const indices: number[] = [];
    let offsetX = 0;
    let offsetY = 0;
    for (const glyph of glyphs) {
      const layer = glyph.group;
      const x = text.Xyz[0] + offsetX + glyph.xoffset * onePixel;
      const y = text.Xyz[1] + offsetY + glyph.yoffset * onePixel;
      const width = glyph.width * onePixel;
      const height = glyph.height * onePixel;
      const x1 = x;
      const y1 = y;
      const x2 = x1 + width * ratio;
      const y2 = y1 - height * ratio;

      const u1 = glyph.x / 256;
      const v1 = glyph.y / 256;
      const u2 = (glyph.x + glyph.width) / 256;
      const v2 = (glyph.y + glyph.height) / 256;

      const startIndex = vertexes.length;

      vertexes.push(
        {
          position: [x1, y1, text.Xyz[2], 1.0],
          texCoord: [u1, v1],
          texLayer: layer,
          color: text.Color.Data,
        },
        {
          position: [x2, y1, text.Xyz[2], 1.0],
          texCoord: [u2, v1],
          texLayer: layer,
          color: text.Color.Data,
        },
        {
          position: [x1, y2, text.Xyz[2], 1.0],
          texCoord: [u1, v2],
          texLayer: layer,
          color: text.Color.Data,
        },
        {
          position: [x2, y2, text.Xyz[2], 1.0],
          texCoord: [u2, v2],
          texLayer: layer,
          color: text.Color.Data,
        }
      );

      indices.push(
        startIndex,
        startIndex + 1,
        startIndex + 2,
        startIndex + 2,
        startIndex + 1,
        startIndex + 3
      );
      offsetX += glyph.xadvance * ratio * onePixel;
      offsetY += glyph.yoffset * onePixel;
    }
    return {
      vertexes: vertexes,
      indices: indices,
    };
  }

  /**
   * Initializes the text renderer
   *
   * Creates canvases for different font size ranges and prepares the sampler
   */
  initialize(): void {
    for (let i = 0; i < 4; i++) {
      this.tempCanvas[i] = new BackendCanvas((i + 1) * 32, 256, 256);
      this.fontCache[i] = new FontGlyphCache();
    }

    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });
  }

  /**
   * Creates and returns a texture array containing all font atlases
   *
   * @returns A WebGPU texture containing all font atlases
   */
  public getTexture(): GPUTexture {
    // const canvas = document.createElement("canvas");
    // canvas.width = 400;
    // canvas.height = 400;
    // const ctx = canvas.getContext("2d");
    // if (!ctx) {
    //   throw new Error("Failed to get 2D context");
    // }
    // // copy image from tempCanvas[0] to canvas
    // ctx.drawImage(this.tempCanvas[1].Canvas, 0, 0);
    // document.body.appendChild(canvas);

    const textureArray = this.device.createTexture({
      label: "text-altas-array",
      size: [256, 256, 4],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.tempCanvas.forEach((canvas, index) => {
      this.device.queue.copyExternalImageToTexture(
        { source: canvas.getData() },
        { texture: textureArray, origin: { x: 0, y: 0, z: index } },
        [256, 256]
      );
    });

    return textureArray;
  }

  /**
   * Gets the sampler used for text rendering
   *
   * @returns The WebGPU sampler for text textures
   * @throws Error if sampler is not initialized
   */
  get Sampler(): GPUSampler {
    if (!this.sampler) {
      throw new Error("Sampler not initialized");
    }

    return this.sampler;
  }
}
