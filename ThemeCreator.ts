import pageConfig from '../blocks';
import type { WordpressBlockTemplate } from './WordpressBlocks';
import { promises as fs } from 'fs';
import * as path from 'path';
import { blue, bold, underline } from "colorette"

const { registeredBlocks, themeDirectory } = pageConfig;
const blocksDirectory = path.join(themeDirectory, 'blocks');
const functionsFilePath = path.join(themeDirectory, 'functions.php');

async function createBlockFiles() {
    await fs.mkdir(blocksDirectory, { recursive: true });

    // Start with a base PHP structure
    let functionsPhpContent = `<?php

function e_s() {
    wp_enqueue_style('mpmedia-admin-css', get_template_directory_uri() . '/astyle.css');
}

function handle_image_request() {
    if (isset($_GET['imageid']) && !empty($_GET['imageid'])) {
        $image_id = intval($_GET['imageid']);
        $image_url = wp_get_attachment_url($image_id);

        // Additional parameters for width, height, and quality
        $width = isset($_GET['width']) ? intval($_GET['width']) : null;
        $height = isset($_GET['height']) ? intval($_GET['height']) : null;
        $quality = isset($_GET['quality']) ? intval($_GET['quality']) : 90;  // Default quality is 90

        if ($image_url) {
            $image_path = get_attached_file($image_id);
            $image_mime = get_post_mime_type($image_id);

            if (file_exists($image_path) && $image_mime) {
                header("Content-Type: $image_mime");
                
                if ($width && $height) {
                    // Resize the image
                    $img = wp_get_image_editor($image_path);
                    if (!is_wp_error($img)) {
                        $img->resize($width, $height, false);
                        $img->set_quality($quality);
                        $img->stream();
                    } else {
                        // Handle error, could not process image
                        status_header(500);
                        echo '500 Internal Server Error - Image processing failed';
                    }
                } else {
                    // Output original image if no dimensions specified
                    // Set quality for JPEG images
                    if ('image/jpeg' == $image_mime) {
                        $img = wp_get_image_editor($image_path);
                        if (!is_wp_error($img)) {
                            $img->set_quality($quality);
                            $img->stream();
                        } else {
                            status_header(500);
                            echo '500 Internal Server Error - Image processing failed';
                        }
                    } else {
                        readfile($image_path);
                    }
                }
                exit;
            }
        }
    
        status_header(404);
        echo '404 Not Found';
        exit;
    }
}
add_action('init', 'handle_image_request');

add_action('enqueue_block_editor_assets', 'e_s');

function my_register_acf_block_types_and_fields() {
    if (function_exists('acf_register_block_type') && function_exists('acf_add_local_field_group')) {
    

    `;

    for (const block of registeredBlocks) {
        const blockPhpContent = generateBlockPhpContent(block);
        const blockFilePath = path.join(blocksDirectory, `${block.blockname}.php`);

        await fs.writeFile(blockFilePath, blockPhpContent, 'utf8');

        functionsPhpContent += generateBlockRegistration(block);
        functionsPhpContent += generateAcfFieldGroup(block);
    }

    // Close the function and add the action hook
    functionsPhpContent += "    }\n}\nadd_action('acf/init', 'my_register_acf_block_types_and_fields');\n";

    await fs.writeFile(functionsFilePath, functionsPhpContent, 'utf8');

    console.log(blue(bold(underline('Blocks, ACF Field Groups, and functions.php updated successfully.'))));
}

function generateBlockPhpContent(block: WordpressBlockTemplate): string {
    if(block.attributes) {

        const attributeVars = Object.entries(block.attributes)
            .map(([key, { fieldName }]) => `$${key} = get_field('${fieldName}');`)
            .join('\n');
            return `<?php\n${attributeVars}\n?>\n\n<div class="mpmedia-block block-${block.blockname}">\n    <h1>${block.blockbeautifulname}</h1>\n</div>\n`;
    } else {
        return `<?php\n?>\n\n<div class="mpmedia-block block-${block.blockname}">\n    <h1>${block.blockbeautifulname}</h1>\n</div>\n`;
    }

}

function generateBlockRegistration(block: WordpressBlockTemplate): string {
    const keywords = block.blockkeywords.map(keyword => `'${keyword}'`).join(', ');

    return `        acf_register_block_type(array(\n` +
           `            'name'              => '${block.blockname}',\n` +
           `            'title'             => __('${block.blockbeautifulname}'),\n` +
           `            'description'       => __('${block.blockdescription}'),\n` +
           `            'render_template'   => 'blocks/${block.blockname}.php',\n` +
           `            'category'          => 'formatting',\n` +
           `            'icon'              => '${block.blockicon}',\n` +
           `            'keywords'          => array(${keywords}),\n` +
           `        ));\n\n`;
}

function generateAcfFieldGroup(block: WordpressBlockTemplate): string {

    let fieldsPhpArray = `array(
        array(
            'key' => 'field_${block.blockname}',
            'label' => 'block_${block.blockname}',
            'type' => 'message',
            'message' => '<h2 style="font-size: 36px!important">${block.blockbeautifulname}</h2>',
        ),`;

    if (!block.attributes) 
        return `        acf_add_local_field_group(array(
            'key' => 'group_${block.blockname}',
            'title' => 'block_${block.blockname}',
            'fields' => array(
                array(
                    'key' => 'field_${block.blockname}',
                    'label' => 'block_${block.blockname}',
                    'type' => 'message',
                    'message' => '<h2 style="font-size: 36px!important">${block.blockbeautifulname}</h2>',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'block',
                        'operator' => '==',
                        'value' => 'acf/${block.blockname}',
                    ),
                ),
            ),
        ));\n\n`;
    
    Object.entries(block.attributes).forEach(([key, attr]) => {

        key = key.replace(/[^a-zA-Z0-9]/g, '_');

        let additionalParameters: string = '';
        if (attr.additionalParameters) {
            Object.entries(attr.additionalParameters).forEach(([paramKey, paramValue]) => {
                additionalParameters += `                '${paramKey}' => '${paramValue}',\n`;
            });
        }
    
        let conditionalLogic: string = '';
        if (attr.conditionalLogic) {
            conditionalLogic += `                'conditional_logic' => array(
                array(
                    array(
                        'field' => 'field_${attr.conditionalLogic.field}',
                        'operator' => '${attr.conditionalLogic.operator}',
                        'value' => '${attr.conditionalLogic.value}',
                    ),
                ),
            ),\n`;
        }
        
        fieldsPhpArray += `array(
                'key' => 'field_${attr.fieldName}',
                'label' => '${attr.fieldName}',
                'name' => '${attr.fieldName}',
                'type' => '${attr.fieldType}',
${additionalParameters}
${conditionalLogic}
            ),`;
    });
    fieldsPhpArray += `)`;

    return `        acf_add_local_field_group(array(
            'key' => 'group_${block.blockname}',
            'title' => 'block_${block.blockname}',
            'fields' => ${fieldsPhpArray},
            'location' => array(
                array(
                    array(
                        'param' => 'block',
                        'operator' => '==',
                        'value' => 'acf/${block.blockname}',
                    ),
                ),
            ),
        ));\n\n`;
}


export { createBlockFiles };
