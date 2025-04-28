# WordPress Headless Theme Builder

A tool for dynamically generating WordPress themes with ACF blocks for headless WordPress setups.

> **Disclaimer**: This project is public but designed for personal use. It's a quick and dirty tool created for a specific project and not intended for general use by others. Use at your own risk.

## Overview

This project provides a streamlined way to generate WordPress themes with Advanced Custom Fields (ACF) blocks from your frontend codebase. It creates all the necessary PHP files for your blocks, including:

- Block templates
- Block registrations
- ACF field group configurations
- Required function hooks

## Requirements

- **ACF PRO** with ACF Blocks (Pro feature)
- A headless WordPress setup with GraphQL support
- Node.js environment for running the generation scripts

## Installation

This project is designed to be used as a git submodule in your WordPress theme project:

1. Add as a submodule to your project:
```bash
git submodule add https://github.com/your-username/wordpress-headless-theme-builder.git
```
2. Configure your block definitions in `blocks.js/.ts` (see Configuration section)
3. Import and use the theme generator in your build process

## Configuration

### Main Configuration File

Create a `blocks.js/.ts` file in your project root with the following structure:

```javascript
import type { WordpressBlockTemplate } from './lib/WordpressBlocks';

const registeredBlocks: Array<WordpressBlockTemplate> = [
  // Your block definitions here
];

export default {
  graphqlUrl: 'https://your-wordpress-site.com/graphql',
  themeDirectory: './wp-content/themes/your-theme',
  registeredBlocks,
  gqlQueryGenerator: (blockAttributes) => `
    // Your GraphQL query template here
  `
};
```

### Block Definition Interface

```typescript
interface WordpressBlockTemplate {
    blockname: string;               // Technical name (no spaces)
    blockslug: string;               // URL-friendly name
    gqlqueryname: string;            // GraphQL query name (must have exactly 2 uppercase letters)
    blockbeautifulname: string;      // Human-readable name
    blockdescription: string;        // Block description
    blockicon: string;               // Dashicon name
    blockkeywords: string[];         // Search keywords
    attributes?: {
        [key: string]: {
            type: string;            // Data type
            fieldType: "text" | "gallery" | "image" | "true_false" | "wysiwyg" | "link"; // ACF field type
            fieldName: string;       // Field name in ACF
            options?: string[];      // Field options
            additionalParameters?: {
                [key: string]: string;
            };
            conditionalLogic?: {
                field: string;
                operator: string;
                value: string;
            };
        };
    };
}
```

### Example Block Definition

```javascript
{
  blockname: 'hero_section',
  blockslug: 'hero-section',
  gqlqueryname: 'CoreHeroSection',  // Note: Must have exactly 2 uppercase letters
  blockbeautifulname: 'Hero Section',
  blockdescription: 'A hero section with image background',
  blockicon: 'format-image',
  blockkeywords: ['hero', 'header', 'banner'],
  attributes: {
    title: {
      type: 'string',
      fieldType: 'text',
      fieldName: 'title'
    },
    backgroundImage: {
      type: 'object',
      fieldType: 'image',
      fieldName: 'background_image'
    },
    showButton: {
      type: 'boolean',
      fieldType: 'true_false',
      fieldName: 'show_button'
    },
    buttonLink: {
      type: 'object',
      fieldType: 'link',
      fieldName: 'button_link',
      conditionalLogic: {
        field: 'show_button',
        operator: '==',
        value: '1'
      }
    }
  }
}
```

## How It Works

1. The `WordpressManager` class connects to your WordPress GraphQL endpoint
2. The theme generation process creates:
   - Individual PHP files for each block in the theme's `blocks` directory
   - A `functions.php` file with all necessary registrations and hooks
   - ACF field group configurations for each block

## GraphQL Integration

The system validates your block definitions against the GraphQL schema. Key points:

- Each `gqlqueryname` must contain exactly 2 uppercase letters
- The GraphQL query is generated based on your block attributes
- Block data is automatically parsed from JSON when fetched

## Customization

You can customize the generated PHP templates by modifying the generator functions in `ThemeCreator.js`:

- `generateBlockPhpContent`: Customize block template output
- `generateBlockRegistration`: Modify how blocks are registered
- `generateAcfFieldGroup`: Change field group configuration

## Troubleshooting

If you encounter errors like "Blocks are outdated", the system will automatically:
1. Generate new block files
2. Notify you to upload these files to your CMS

## Security Note

The code includes SSL validation disabling for development purposes:
```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
```

**Important**: Remove this line or conditionally enable it only in development environments.

## License

MIT License

## Contributing

If you like this, feel free to fork it. 
