interface WordpressBlockTemplate {
    blockname: string;
    blockslug: string;
    gqlqueryname: string;
    blockbeautifulname: string;
    blockdescription: string;
    blockicon: string;
    blockkeywords: string[];
    attributes?: {
        [key: string]: {
            type: string;
            fieldType: "text" | "gallery" | "image" | "true_false" | "wysiwyg" | "link"; // supported field types
            fieldName: string;
            options?: string[];
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

export type { WordpressBlockTemplate };
