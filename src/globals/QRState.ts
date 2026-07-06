export interface IQRState {
  posts: any[];
  req: any;
  nodes: any;
  selected: any;
  postingIsEnabled: boolean;
  submit?: any;
  focus?: any;
  open?: any;
  close?: any;
  error?: any;
  captcha?: any;
  cooldown?: any;
  post?: any;
}

const QRState: IQRState = {
  posts: [],
  req: null,
  nodes: null,
  selected: null,
  postingIsEnabled: false,
  captcha: null,
  cooldown: null,
};

export default QRState;
