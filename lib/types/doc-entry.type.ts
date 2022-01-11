export type DocParam = {
    type: string;
    imports: Record<string, string>;
};

export type DocReturn = {
    name: string;
    imports: Record<string, string>;
};

export type DocTopic = {
    enumName?: string;
    argString?: string;
    importPath?: string;
};

export type DocEntry = {
    functionName: string;
    params: DocParam;
    returnType: DocReturn;
    topic: DocTopic;
};
