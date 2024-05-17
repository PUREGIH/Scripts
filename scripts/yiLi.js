/**
 * 脚本名称：伊利乳品（修改自id77）
 * 活动说明：每日任务可获得积分，兼容 NE 手机代理和青龙等 Node.js 环境，变量名称 id77_yiLi_cookies
 * 脚本来源：https://github.com/id77/QuantumultX/blob/master/task/yiLi.js
 * 更新时间：2023-08-29

 > 支持多账号
 > 进入小程序点我的

hostname = club.yili.com

# Surge
伊利乳品 = type=http-request, requires-body=1, pattern=https:\/\/club\.yili\.com\/MALLIFChe\/MCSWSIAPI\.asmx\/Call,script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/yiLi.js
伊利乳品 = type=cron,cronexp=10 0 * * *,script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/yiLi.js,wake-system=true

# QuanX
https:\/\/club\.yili\.com\/MALLIFChe\/MCSWSIAPI\.asmx\/Call url script-request-body https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/yiLi.js
10 0 * * * https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/yiLi.js, tag=伊利乳品, img-url=https://raw.githubusercontent.com/id77/QuantumultX/master/icon/yiLi.png

# Loon
http-request https:\/\/club\.yili\.com\/MALLIFChe\/MCSWSIAPI\.asmx\/Call script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/yiLi.js, requires-body=true,
cron "10 0 * * *" script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/yiLi.js

 */

const $ = new Env('伊利乳品');
$.COOKIES_KEY = 'id77_yiLi_cookies';
const fs = require('fs');
const cookieFilePath = './yiLi_cookies.json'; // Adjust the path if needed
let users = $.getdata($.COOKIES_KEY);

// $.isNode() && (users = process.env.id77_yiLi_cookies);
// $.users = users ? JSON.parse(users) : {};
// $.openIds = Object.keys($.users) || [];
// $.userInfo = $.recipeTaskResult = {};


// $.inviteIds = [
//   '9b0dcaec-8281-4007-a331-ba1e5b07f5ac',
//   '5bfaabe5-7ffb-4033-a129-5c8590ba22f8',
//   '625bf8e5-294a-4203-b616-485570c3c52f',
//   '2d82dc6c-877d-4ed5-b4c4-684b9b4a5f3f',
// ];

$.cookBookIDs = [49, 45, 46, 29, 30, 14, 6];
$.cookBookID = $.cookBookIDs[Math.floor(Math.random() * $.cookBookIDs.length)];

const headers = {
  'Accept-Encoding': `gzip,deflate,br`,
  'content-type': `application/x-www-form-urlencoded`,
  Connection: `keep-alive`,
  Accept: `*/*`,
  Host: `club.yili.com`,
  'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/7.0.15(0x17000f27) NetType/WIFI Language/zh_CN`,
};

const body = {
  DeviceCode: 'DeviceCode',
  CompressFlag: 'Y',
};

!(async () => {
    // Read cookies from the JSON file
  try {
    if (!fs.existsSync(cookieFilePath)) {
      throw new Error("Cookie file not found.");
    }

    const cookieFileContent = await $.get({ url: cookieFilePath });
    $.users = JSON.parse(cookieFileContent);
    $.openIds = Object.keys($.users) || [];
  } catch (error) {
    if (error.message.includes("no such file or directory")) {
      $.log("Error loading cookies: File not found.");
    } else if (error instanceof SyntaxError) {
      $.log("Error loading cookies: Invalid JSON format in file.");
    } else {
      $.log("Error loading cookies:", error.message); // Generic error message
    }

    $.desc = '请将Cookie保存到 yiLi_cookies.json 文件中。';
    $.msg($.name, $.subt, $.desc);
    return; // Exit the script if cookies can't be loaded
  }

  if (typeof $request !== `undefined`) {
    if ($request?.body?.includes('MALLIFCheese.GetPointsBalance')) {
      let reqBody = JSON.parse(
        decodeURIComponent($request.body)
          .replace(/RequestPack=/, '')
          .replace(/\\/g, '')
          .replace(/("(\{|\[))|((\}|\])")/g, '$2$4')
      );
      // $.log(JSON.stringify(reqBody));

      const {
        AuthKey,
        Params: { OpenId },
      } = reqBody;

      $.userInfo = {
        authKey: AuthKey,
        openId: OpenId,
      };

      // 获取账号信息，写入 $.userInfo
      await getUserInfo();

      $.users[OpenId] = $.userInfo;

      if ($.userInfo.aspnetUserId) {
        if ($.setdata(JSON.stringify($.users), $.COOKIES_KEY)) {
          $.subt = `获取会话: 成功!`;
        } else {
          $.subt = `获取会话: 失败!`;
        }
        $.msg($.name, $.subt);
      }
    }
  } else {
    for (let i = 0; i < $.openIds.length; i++) {
      $.openId = $.openIds[i];
      $.user = $.users[$.openId];
      $.log('===>\n');
      await anonymousLogin();
      // $.log(JSON.stringify($.user));
      const loginResult = await loginByWechatOpenId();
      // const loginResult = await quickLoginMini();

      if (loginResult.Return === -100) {
        $.subt = `${$.user.ClientName} Cookie 已失效`;
        $.desc = '请获取根据说明获取Cookie，点击前往';
        $.msg($.name, $.subt, $.desc, {
          'open-url':
            'https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/yiLi.js',
        });

        continue;
      }
      if (!$.userInfo.aspnetUserId) {
        $.subt = `${$.user.ClientName} 出错`;
        $.desc = `${loginResult.ReturnInfo}`;
        $.msg($.name, $.subt, $.desc);

        continue;
      } else {
        $.users[$.openId] = $.userInfo;
        $.setdata(JSON.stringify($.users), $.COOKIES_KEY);

        const { aspnetUserId } = $.userInfo;
        // $.inviteIds = $.inviteIds.filter((item) => item !== aspnetUserId);

        await sign();

        // await inRecipe();
        // await relatedRecipe();
        await recipeTask();
        await dryGoodsTask();
        await shareTask();
        await shareDryGoodsTask();

        // for (let k = 0; k < $.inviteIds.length; k++) {
        //   $.inviteId = $.inviteIds[k];
        // await invite();
        // }

        await showMsg();
      }
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

function sign() {
  const _this = this;
  return new Promise((resolve) => {
    const { authKey, openId } = $.userInfo;
    const params = JSON.stringify({
      OpenId: openId,
      Platform: 'YLCheese_SmallPragram',
      DeviceCode: 'DeviceCode',
    });
    body.AuthKey = authKey;
    body.Method = 'MALLIFCheese.SignDailyAttenceJson';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        if (!data) return;

        $.signDetail = XMLtoJson(data);
      } catch (e) {
        $.log(`========${_this.name}=====`);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function anonymousLogin() {
  const _this = this;
  return new Promise((resolve) => {
    const params = JSON.stringify({
      UserName: 'YLCheese',
      Password: 'ylche2020!',
      DeviceCode: 'DeviceCode',
      ExtParams: '',
    });

    delete body.AuthKey;
    body.Method = 'MALLIFCheese.Login';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        if (!data) return;

        data = XMLtoJson(data);

        const { AuthKey } = data.Result;

        $.user.authKey = AuthKey;
      } catch (e) {
        $.log(`========${_this.name}=====`);
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function loginByWechatOpenId() {
  const _this = this;
  return new Promise((resolve) => {
    const { authKey } = $.user;

    const params = JSON.stringify({
      Platform: 'YLCheese_SmallPragram',
      OpenId: $.openId,
      DeviceCode: 'DeviceCode',
    });

    body.AuthKey = authKey;
    body.Method = 'MALLIFCheese.LoginByWechatOpenId';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        if (!data) return;

        if (!data) return;

        data = XMLtoJson(data);
        const { UserInfo, AuthKey } = data.Result;

        $.userInfo = {
          ...$.userInfo,
          ...UserInfo,
          authKey: AuthKey,
        };
      } catch (e) {
        $.log(`========${_this.name}=====`);
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

// function quickLoginMini() {
//   const _this = this;
//   return new Promise((resolve) => {
//     const { openId, authKey, ClientName, StaffMobile } = $.user;

//     const params = JSON.stringify({
//       OpenId: openId,
//       Platform: 'YLCheese_SmallPragram',
//       MallCode: 'YLCheese',
//       UnionId: '',
//       Mobile: StaffMobile,
//       VerifyID: 2020,
//       VerifyCode: 8888,
//       RealName: ClientName, // 注册名字
//       // OfficialCity: '1606', // 广州
//       // OfficialCityName: '广东省,广州市,荔湾区',
//       // Position: '2', //位置
//       // RestaurantType: '2', //餐厅类型
//       // HeadImg: '',
//       // NickName: '', // 微信昵称
//       RegisterSource: 121,
//     });
//     body.AuthKey = authKey;
//     body.Method = 'MALLIFCheese.QuickLoginMini';
//     body.Params = params;

//     const opts = {
//       headers,
//       body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
//     };
//     opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

//     $.post(opts, (err, resp, data) => {
//       try {
//         if (!data) return;

//         data = XMLtoJson(data);
//         const { UserInfo, AuthKey } = data.Result;

//         $.userInfo = {
//           ...$.userInfo,
//           ...UserInfo,
//           authKey: AuthKey,
//         };
//       } catch (e) {
//         $.log(`========${_this.name}=====`);
//         $.logErr(e, resp);
//       } finally {
//         resolve(data);
//       }
//     });
//   });
// }

// 进入阅读菜谱
// function inRecipe() {
//   const _this = this;
//   return new Promise((resolve) => {
//     const { openId, authKey } = $.userInfo;

//     const params = JSON.stringify({
//       CookBookID: $.cookBookID,
//     });
//     body.AuthKey = authKey;
//     body.Method = 'MALLIFCheese.GetCKCookBookByID';
//     body.Params = params;

//     const opts = {
//       headers,
//       body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
//     };
//     opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

//     $.post(opts, (err, resp, data) => {
//       try {
//         if (!data) return;

//         // data = XMLtoJson(data);

//         $.log(`阅读食谱`);
//       } catch (e) {
//         $.log(`========${_this.name}=====`);
//         $.logErr(e, resp);
//       } finally {
//         resolve(data);
//       }
//     });
//   });
// }

// 任务食谱关联
// function relatedRecipe() {
//   const _this = this;
//   return new Promise((resolve) => {
//     const { openId, authKey } = $.userInfo;

//     const params = JSON.stringify({
//       ActivityCode: 'YLCheese_20200623_ViewMenu',
//     });
//     body.AuthKey = authKey;
//     body.Method = 'MALLIFCheese.IsHaveAddMemberPoints';
//     body.Params = params;

//     const opts = {
//       headers,
//       body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
//     };
//     opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

//     $.post(opts, (err, resp, data) => {
//       try {
//         if (!data) return;

//         // data = XMLtoJson(data);

//         $.log(`关联食谱`);
//       } catch (e) {
//         $.log(`========${_this.name}=====`);
//         $.logErr(e, resp);
//       } finally {
//         resolve(data);
//       }
//     });
//   });
// }

// 浏览菜谱15s任务
function recipeTask() {
  const _this = this;
  return new Promise((resolve) => {
    const { openId, authKey } = $.userInfo;

    const params = JSON.stringify({
      ActivityCode: 'YLCheese_20200623_ViewMenu',
      Remark: '浏览菜谱15秒加分',
      Key: new Date().getTime(),
      Points: 15,
    });
    body.AuthKey = authKey;
    body.Method = 'MALLIFCheese.AddMemberPoints1Json';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        if (!data) return;

        data = XMLtoJson(data);

        $.recipeTaskResult = data;
      } catch (e) {
        $.log(`========${_this.name}=====`);
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

// 浏览干货15s任务
function dryGoodsTask() {
  const _this = this;
  return new Promise((resolve) => {
    const { openId, authKey } = $.userInfo;

    const params = JSON.stringify({
      ActivityCode: 'YLCheese_20230210_ViewDryGoods',
      Remark: '浏览干货15秒加分',
      Key: new Date().getTime(),
      Points: 10,
    });
    body.AuthKey = authKey;
    body.Method = 'MALLIFCheese.AddMemberPoints1Json';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        if (!data) return;

        data = XMLtoJson(data);

        $.dryGoodsTaskResult = data;
      } catch (e) {
        $.log(`========${_this.name}=====`);
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

// // 分享任务ID关联
// function relatedShareTaskId() {
//   const _this = this;
//   return new Promise((resolve) => {
//     const { openId, authKey } = $.userInfo;

//     const params = JSON.stringify({
//       CookBookID: $.cookBookID,
//       InteractivType: 3,
//     });
//     body.AuthKey = authKey;
//     body.Method = 'MALLIFCheese.GetCookBookInteractiveRecord';
//     body.Params = params;

//     const opts = {
//       headers,
//       body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
//     };
//     opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

//     $.post(opts, (err, resp, data) => {
//       try {
//         if (!data) return;

//         // data = XMLtoJson(data);

//         $.log(`分享任务ID关联`);
//       } catch (e) {
//         $.log(`========${_this.name}=====`);
//         $.logErr(e, resp);
//       } finally {
//         resolve(data);
//       }
//     });
//   });
// }

// 菜谱分享任务
function shareTask() {
  const _this = this;
  return new Promise((resolve) => {
    const { openId, authKey, ClientName, StaffMobile } = $.userInfo;

    const params = JSON.stringify({
      CookBookID: $.cookBookID,
      InteractivType: 4,
    });
    body.AuthKey = authKey;
    body.Method = 'MALLIFCheese.SaveCookBookToFavorite';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        if (!data) return;

        data = XMLtoJson(data);

        $.shareTaskResult = data;
      } catch (e) {
        $.log(`========${_this.name}=====`);
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

// 分享干货任务
function shareDryGoodsTask() {
  const _this = this;
  return new Promise((resolve) => {
    const { openId, authKey, ClientName, StaffMobile } = $.userInfo;

    const params = JSON.stringify({
      ActivityCode: 'YLCheese_20230210_ShareDryGoods',
      Remark: '转发干货',
      Key: new Date().getTime(),
      Points: 15,
    });
    body.AuthKey = authKey;
    body.Method = 'MALLIFCheese.AddMemberPoints1Json';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        if (!data) return;

        data = XMLtoJson(data);

        $.shareDryGoodsTaskResult = data;
      } catch (e) {
        $.log(`========${_this.name}=====`);
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

// function invite() {
//   const _this = this;
//   return new Promise((resolve) => {
//     const { authKey } = $.userInfo;

//     $.inviteId = $.inviteIds[Math.floor(Math.random() * $.inviteIds.length)];

//     const params = JSON.stringify({
//       RecMemberID: $.inviteId,
//     });
//     body.AuthKey = authKey;
//     body.Method = 'MALLIFCheese.RecommendHelpingJson';
//     body.Params = params;

//     const opts = {
//       headers,
//       body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
//     };
//     opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

//     $.post(opts, (err, resp, data) => {
//       try {
//         if (!data) return;

//         // data = XMLtoJson(data);
//       } catch (e) {
//         $.log(`========${_this.name}=====`);
//         $.logErr(e, resp);
//       } finally {
//         resolve(data);
//       }
//     });
//   });
// }

function showMsg() {
  return new Promise(async (resolve) => {
    const { Return, ReturnInfo } = $.signDetail;
    const { ClientName } = $.user;
    $.subt = `🙆🏻‍♂️账号[${ClientName}]签到: `;
    if (Return >= 0) {
      $.subt += `成功 ${ReturnInfo}`;
    } else {
      $.subt += `失败 ${ReturnInfo}`;
    }

    $.desc = `📚浏览菜谱任务：`;
    if ($.recipeTaskResult.Return >= 0) {
      $.desc += `成功 ${$.recipeTaskResult.ReturnInfo}`;
    } else {
      $.desc += `失败 ${$.recipeTaskResult.ReturnInfo}`;
    }

    $.desc = `📚浏览干货任务：`;
    if ($.dryGoodsTaskResult.Return >= 0) {
      $.desc += `成功 ${$.dryGoodsTaskResult.ReturnInfo}`;
    } else {
      $.desc += `失败 ${$.dryGoodsTaskResult.ReturnInfo}`;
    }

    $.desc += `\n🕊分享菜谱任务：`;
    if ($.shareTaskResult.Return >= 0) {
      $.desc += `成功 ${$.shareTaskResult.ReturnInfo}`;
    } else {
      $.desc += `失败 ${$.shareTaskResult.ReturnInfo}`;
    }

    $.desc += `\n🕊分享干货任务：`;
    if ($.shareDryGoodsTaskResult.Return >= 0) {
      $.desc += `成功 ${$.shareDryGoodsTaskResult.ReturnInfo}`;
    } else {
      $.desc += `失败 ${$.shareDryGoodsTaskResult.ReturnInfo}`;
    }
    if ($.isNode()) {
      const notify = require('./sendNotify');
      await notify.sendNotify($.name, $.subt + "\n" + $.desc);
    } else {
      $.msg($.name, $.subt, $.desc);
    }
    resolve();
  });
}

function getUserInfo() {
  return new Promise((resolve) => {
    const { authKey, openId } = $.userInfo;
    const params = JSON.stringify({
      OpenId: openId,
      Platform: 'YLCheese_SmallPragram',
      DeviceCode: 'DeviceCode',
    });
    body.AuthKey = authKey;
    body.Method = 'MALLIFCheese.LoginByWechatOpenId';
    body.Params = params;

    const opts = {
      headers,
      body: `RequestPack=${encodeURIComponent(JSON.stringify(body))}`,
    };
    opts.url = `https://club.yili.com/MALLIFChe/MCSWSIAPI.asmx/Call`;

    $.post(opts, (err, resp, data) => {
      try {
        data = XMLtoJson(data).Result.UserInfo;

        $.userInfo = {
          ...$.userInfo,
          ...data,
        };
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function XMLtoJson(xml) {
  return JSON.parse(
    xml
      .match(/>(.*)<\//)[1]
      .replace(/\\/g, '')
      .replace(/("(\{|\[))|((\}|\])")/g, '$2$4')
  );
}


// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), a = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: i, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: a } = t, n = i.decode(a, this.encoding); e(null, { status: s, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), this.isSurge() || this.isQuanX() || this.isLoon() ? $done(t) : this.isNode() && process.exit(1) } }(t, e) }
