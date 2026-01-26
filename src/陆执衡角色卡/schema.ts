export const Schema = z.object({
  世界环境: z.object({
    时间: z.string(),
    气候: z.object({
      季节: z.string(),
      天气: z.string(),
      温度: z.coerce.number(),
    }),
  }),
  孟砚白: z.object({
    服装: z.object({
      上衣: z.string(),
      下衣: z.string(),
      鞋子: z.string(),
      配饰: z.string(),
    }),
    心理活动: z.object({
      表层想法: z.string(),
      深层欲念: z.string(),
    }),
    手机: z.object({
      最近搜索: z.array(z.string()).transform(list => list.slice(-3)),
    }),
    备忘录: z.array(z.string()),
    克制值: z.coerce.number(),
    亲密度: z.coerce.number(),
    情绪: z.string(),
    生理征兆: z.string(),
    当前姿势: z.string(),
    当前位置: z.object({
      地点: z.string(),
      具体方位: z.string(),
    }),
  }),
  user: z.object({
    当前位置: z.object({
      地点: z.string(),
      具体方位: z.string(),
    }),
    服装: z.object({
      上衣: z.string(),
      下衣: z.string(),
      鞋子: z.string(),
      配饰: z.string(),
    }),
  }),
});
export type Schema = z.output<typeof Schema>;