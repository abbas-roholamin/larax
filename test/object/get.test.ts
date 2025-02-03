/** @format */
import { describe, expect, test } from "vitest"
import Obj from "../../src/object"

describe("Obj", () => {
  test("Get", () => {
    expect(
      Obj.get({
        obj: {
          my: "my",
          foo: {
            bar: "bar",
          },
        },
        path: "my",
      }),
    ).toBe("my")

    expect(
      Obj.get({
        obj: {
          my: "my",
          foo: {
            bar: "bar",
          },
        },
        path: "foo.bar",
      }),
    ).toBe("bar")

    expect(
      Obj.get({
        obj: {
          my: "my",
          foo: {
            bar: "bar",
          },
        },
        path: "foo",
      }),
    ).toStrictEqual({
      bar: "bar",
    })

    expect(
      Obj.get({
        obj: {
          my: "my",
          foo: {
            bar: "bar",
          },
        },
        path: "bar",
      }),
    ).toBeUndefined()

    expect(
      Obj.get({
        obj: {
          my: "my",
          foo: {
            bar: "bar",
          },
        },
        path: "bar",
        daf: "default",
      }),
    ).toBe("default")
  })
})
