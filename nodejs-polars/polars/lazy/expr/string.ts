import {DataType} from "../../datatypes";
import pli from "../../internals/polars_internal";
import { regexToString } from "../../utils";
import {Expr} from "../expr";

/**
 * namespace containing expr string functions
 */
export interface ExprString {
  /**
   * Vertically concat the values in the Series to a single string value.
   * @example
   * ```
   * >>> df = pl.DataFrame({"foo": [1, null, 2]})
   * >>> df = df.select(pl.col("foo").str.concat("-"))
   * >>> df
   * shape: (1, 1)
   * ┌──────────┐
   * │ foo      │
   * │ ---      │
   * │ str      │
   * ╞══════════╡
   * │ 1-null-2 │
   * └──────────┘
   * ```
   */
  concat(delimiter: string): Expr;
  /** Check if strings in Series contain regex pattern. */
  contains(pat: string | RegExp): Expr;
  /**
   * Decodes a value using the provided encoding
   * @param encoding - hex | base64
   * @param strict - how to handle invalid inputs
   *
   *     - true: method will throw error if unable to decode a value
   *     - false: unhandled values will be replaced with `null`
   * @example
   * ```
   * >>> df = pl.DataFrame({"strings": ["666f6f", "626172", null]})
   * >>> df.select(col("strings").str.decode("hex"))
   * shape: (3, 1)
   * ┌─────────┐
   * │ strings │
   * │ ---     │
   * │ str     │
   * ╞═════════╡
   * │ foo     │
   * ├╌╌╌╌╌╌╌╌╌┤
   * │ bar     │
   * ├╌╌╌╌╌╌╌╌╌┤
   * │ null    │
   * └─────────┘
   * ```
   */
  decode(encoding: "hex" | "base64", strict?: boolean): Expr
  decode(options: {encoding: "hex" | "base64", strict?: boolean}): Expr
  /**
   * Encodes a value using the provided encoding
   * @param encoding - hex | base64
   * @example
   * ```
   * >>> df = pl.DataFrame({"strings", ["foo", "bar", null]})
   * >>> df.select(col("strings").str.encode("hex"))
   * shape: (3, 1)
   * ┌─────────┐
   * │ strings │
   * │ ---     │
   * │ str     │
   * ╞═════════╡
   * │ 666f6f  │
   * ├╌╌╌╌╌╌╌╌╌┤
   * │ 626172  │
   * ├╌╌╌╌╌╌╌╌╌┤
   * │ null    │
   * └─────────┘
   * ```
   */
  encode(encoding: "hex" | "base64"): Expr
  /**
   * Extract the target capture group from provided patterns.
   * @param pattern A valid regex pattern
   * @param groupIndex Index of the targeted capture group.
   * Group 0 mean the whole pattern, first group begin at index 1
   * Default to the first capture group
   * @returns Utf8 array. Contain null if original value is null or regex capture nothing.
   * @example
   * ```
   * > df = pl.DataFrame({
   * ...   'a': [
   * ...       'http://vote.com/ballon_dor?candidate=messi&ref=polars',
   * ...       'http://vote.com/ballon_dor?candidat=jorginho&ref=polars',
   * ...       'http://vote.com/ballon_dor?candidate=ronaldo&ref=polars'
   * ...   ]})
   * > df.select(pl.col('a').str.extract(/candidate=(\w+)/, 1))
   * shape: (3, 1)
   * ┌─────────┐
   * │ a       │
   * │ ---     │
   * │ str     │
   * ╞═════════╡
   * │ messi   │
   * ├╌╌╌╌╌╌╌╌╌┤
   * │ null    │
   * ├╌╌╌╌╌╌╌╌╌┤
   * │ ronaldo │
   * └─────────┘
   * ```
   */
  extract(pat: string | RegExp, groupIndex: number): Expr;
  /**
   * Extract the first match of json string with provided JSONPath expression.
   * Throw errors if encounter invalid json strings.
   * All return value will be casted to Utf8 regardless of the original value.
   * @see https://goessner.net/articles/JsonPath/
   * @param jsonPath - A valid JSON path query string
   * @returns Utf8 array. Contain null if original value is null or the `jsonPath` return nothing.
   * @example
   * ```
   * >>> df = pl.DataFrame({
   * ...   'json_val': [
   * ...     '{"a":"1"}',
   * ...     null,
   * ...     '{"a":2}',
   * ...     '{"a":2.1}',
   * ...     '{"a":true}'
   * ...   ]
   * ... })
   * >>> df.select(pl.col('json_val').str.jsonPathMatch('$.a')
   * shape: (5,)
   * Series: 'json_val' [str]
   * [
   *     "1"
   *     null
   *     "2"
   *     "2.1"
   *     "true"
   * ]
   * ```
   */
  jsonPathMatch(pat: string): Expr;
  /**  Get length of the string values in the Series. */
  lengths(): Expr;
  /** Remove leading whitespace. */
  lstrip(): Expr
  /** Replace first regex match with a string value. */
  replace(pat: string | RegExp, val: string): Expr;
  /** Replace all regex matches with a string value. */
  replaceAll(pat: string | RegExp, val: string): Expr;
  /** Modify the strings to their lowercase equivalent. */
  toLowerCase(): Expr;
  /** Modify the strings to their uppercase equivalent. */
  toUpperCase(): Expr;
  /** Remove trailing whitespace. */
  rstrip(): Expr
  /**
   * Create subslices of the string values of a Utf8 Series.
   * @param start - Start of the slice (negative indexing may be used).
   * @param length - Optional length of the slice.
   */
  slice(start: number, length?: number): Expr;
    /**
   * Parse a Series of dtype Utf8 to a Date/Datetime Series.
   * @param datatype Date or Datetime.
   * @param fmt formatting syntax. [Read more](https://docs.rs/chrono/0.4.19/chrono/format/strftime/index.html)
   */
  strftime(datatype: DataType.Date, fmt?: string): Expr
  strftime(datatype: DataType.Datetime, fmt?: string): Expr
}

export const ExprStringFunctions = (_expr: any): ExprString => {
  const wrap = (method, args?): Expr => {

    return Expr(pli.expr.str[method]({_expr, ...args }));
  };
  const handleDecode = (encoding, strict) => {
    switch (encoding) {
    case "hex":
      return wrap(`decodeHex`, {strict});
    case "base64":
      return wrap(`decodeBase64`, {strict});
    default:
      throw new RangeError("supported encodings are 'hex' and 'base64'");
    }
  };

  return {
    concat(delimiter: string) {
      return wrap("concat", {delimiter});
    },
    contains(pat: string | RegExp) {
      return wrap("contains", {pat: regexToString(pat)});
    },
    decode(arg, strict=false) {
      if(typeof arg === "string") {
        return handleDecode(arg, strict);
      }

      return handleDecode(arg.encoding, arg.strict);
    },
    encode(encoding) {
      switch (encoding) {
      case "hex":
        return wrap(`encodeHex`);
      case "base64":
        return wrap(`encodeBase64`);
      default:
        throw new RangeError("supported encodings are 'hex' and 'base64'");
      }
    },
    extract(pat: string | RegExp, groupIndex: number) {
      return wrap("extract", {pat: regexToString(pat), groupIndex});
    },
    jsonPathMatch(pat: string) {
      return wrap("jsonPathMatch", {pat});
    },
    lengths() {
      return wrap("lengths");
    },
    lstrip() {
      return wrap("replace", {pat: /^\s*/.source, val: ""});
    },
    replace(pat: RegExp, val: string) {
      return wrap("replace", {pat: regexToString(pat), val});
    },
    replaceAll(pat: RegExp, val: string) {
      return wrap("replaceAll", {pat: regexToString(pat), val});
    },
    rstrip() {
      return wrap("replace", {pat: /[ \t]+$/.source, val: ""});
    },
    slice(start: number, length?: number) {
      return wrap("slice", {start, length});
    },
    strftime(dtype, fmt?) {
      if (dtype === DataType.Date) {
        return wrap("parseDate", {fmt});
      } else if (dtype === DataType.Datetime) {
        return wrap("parseDateTime", {fmt});
      } else {
        throw new Error(`only "DataType.Date" and "DataType.Datetime" are supported`);
      }
    },
    toLowerCase() {
      return wrap("toLowerCase");
    },
    toUpperCase() {
      return wrap("toUpperCase");
    },
  };
};
