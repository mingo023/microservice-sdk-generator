export type DocParam = {
  name: string;
  type: string;
  imports: string[];
};

export type DocReturn = {
  name: string;
  imports: string[];
};

export type DocEntry = {
  functionName: string;
  params: DocParam;
  returnType: DocReturn;
};
