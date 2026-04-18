import {
  deleteApiV1MoviesId,
  deleteApiV1UsersId,
  getApiV1MoviesId,
  getApiV1Movies,
  getApiV1UsersId,
  getApiV1Users,
  postApiV1AuthLogin,
  postApiV1Movies,
  postApiV1Users,
  putApiV1MoviesId,
  putApiV1UsersId,
} from "@/lib/api/generated/swagger";
import type {
  GithubComYourUsernameBackendProjectInternalServiceCreateMovieInput,
  GithubComYourUsernameBackendProjectInternalServiceCreateUserInput,
  GithubComYourUsernameBackendProjectInternalServiceLoginInput,
  GithubComYourUsernameBackendProjectInternalServiceUpdateMovieInput,
  GithubComYourUsernameBackendProjectInternalServiceUpdateUserInput,
} from "@/lib/api/generated/swagger-model";
import type { Episode, Series } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

function mapEpisodesFromMovie(raw: UnknownRecord, seriesId: string): Episode[] {
  const media = Array.isArray(raw.media) ? raw.media : [];
  const episodes = media
    .map((item, index) => {
      const rec = asRecord(item);
      const url = asString(rec.src);
      if (!url) return null;
      return {
        id: asString(rec.id, `${seriesId}-ep-${index + 1}`),
        title: asString(rec.title, `ตอนที่ ${index + 1}`),
        url,
        order: index + 1,
      };
    })
    .filter(Boolean) as Episode[];

  return episodes;
}

function mapMovieToSeries(movie: unknown): Series {
  const raw = asRecord(movie);
  const id = asString(
    raw.movieId || raw.movie_id || raw.id || raw._id,
    `${asString(raw.title, "movie")}-${asString(raw.createdAt, "unknown")}`
  );
  const title = asString(raw.title || raw.name, "ไม่ระบุชื่อเรื่อง");
  const description = asString(raw.description || raw.detail);
  const tags = asStringArray(raw.type);
  const createdAt = asString(raw.createdAt, new Date().toISOString().slice(0, 10));
  const views = asNumber(raw.views ?? raw.viewCount, 0);
  const episodes = mapEpisodesFromMovie(raw, id);
  const image = asString(raw.image);
  const coverUrl =
    image ||
    asString(raw.coverUrl || raw.thumbnail) ||
    asString(asRecord(Array.isArray(raw.media) ? raw.media[0] : undefined).src) ||
    "https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=900&q=80";

  return { id, title, description, coverUrl, views, createdAt, episodes, tags };
}

export function mapMovieToSeriesItem(movie: unknown): Series {
  return mapMovieToSeries(movie);
}

export async function fetchSeriesList(search?: string): Promise<Series[]> {
  const res = await getApiV1Movies(search ? { search } : undefined);
  if (res.status !== 200 || !Array.isArray(res.data)) return [];
  return res.data.map(mapMovieToSeries);
}

export async function fetchSeriesById(id: string): Promise<Series | null> {
  const res = await getApiV1MoviesId(id);
  if (res.status !== 200 || !res.data || typeof res.data !== "object") return null;
  return mapMovieToSeries(res.data);
}

export async function createSeries(payload: {
  title: string;
  description: string;
  coverUrl: string;
  tags: string[];
  /** Must be a valid Mongo ObjectID hex of an existing user, or omit / leave empty. */
  uploadBy?: string;
  episodes: Array<{ title: string; url: string }>;
}): Promise<boolean> {
  const movieInput: GithubComYourUsernameBackendProjectInternalServiceCreateMovieInput = {
    title: payload.title,
    description: payload.description,
    image: payload.coverUrl,
    type: payload.tags,
    ...(payload.uploadBy?.trim() ? { uploadBy: payload.uploadBy.trim() } : {}),
    media: payload.episodes.map((ep) => ({ title: ep.title, src: ep.url })),
  };
  const res = await postApiV1Movies(movieInput);
  return res.status === 201;
}

export async function createSeriesAndGetId(payload: {
  title: string;
  description: string;
  coverUrl: string;
  tags: string[];
  uploadBy?: string;
  episodes: Array<{ title: string; url: string }>;
}): Promise<{ ok: boolean; id: string; errorMessage?: string }> {
  const movieInput: GithubComYourUsernameBackendProjectInternalServiceCreateMovieInput = {
    title: payload.title,
    description: payload.description,
    image: payload.coverUrl,
    type: payload.tags,
    ...(payload.uploadBy?.trim() ? { uploadBy: payload.uploadBy.trim() } : {}),
    media: payload.episodes.map((ep) => ({ title: ep.title, src: ep.url })),
  };
  const res = await postApiV1Movies(movieInput);
  const data = asRecord(res.data);
  if (res.status !== 201) {
    const errMsg = asString(data.message, `สร้างไม่สำเร็จ (HTTP ${res.status})`);
    return { ok: false, id: "", errorMessage: errMsg };
  }
  const id = asString(data.movieId || data.movie_id || data.id || data._id);
  if (!id) {
    return { ok: false, id: "", errorMessage: "API ตอบ 201 แต่ไม่พบ movieId ใน response" };
  }
  return { ok: true, id };
}

export async function updateSeries(
  id: string,
  payload: {
    title: string;
    description: string;
    coverUrl: string;
    tags: string[];
    uploadBy?: string;
    episodes: Array<{ title: string; url: string }>;
  }
): Promise<boolean> {
  const updateInput: GithubComYourUsernameBackendProjectInternalServiceUpdateMovieInput = {
    title: payload.title,
    description: payload.description,
    image: payload.coverUrl,
    type: payload.tags,
    ...(payload.uploadBy ? { uploadBy: payload.uploadBy } : {}),
    media: payload.episodes.map((ep) => ({ title: ep.title, src: ep.url })),
  };
  const res = await putApiV1MoviesId(id, updateInput);
  return res.status === 200;
}

export async function deleteSeries(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await deleteApiV1MoviesId(id);
  if (res.status === 204) {
    return { ok: true };
  }
  const data = asRecord(res.data);
  return {
    ok: false,
    message: asString(data.message, `ลบไม่สำเร็จ (HTTP ${res.status})`),
  };
}

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  expiredDate: string | null;
};

function mapApiUser(user: unknown): ApiUser {
  const raw = asRecord(user);
  return {
    id: asString(raw.userId || raw.id || raw._id, ""),
    name: asString(raw.name, "ไม่ระบุชื่อ"),
    email: asString(raw.email),
    isActive: Boolean(raw.isActive),
    isAdmin: Boolean(raw.isAdmin),
    expiredDate: typeof raw.expiredDate === "string" ? raw.expiredDate : null,
  };
}

export async function fetchUsers(search?: string): Promise<ApiUser[]> {
  const res = await getApiV1Users(search ? { search } : undefined);
  if (res.status !== 200 || !Array.isArray(res.data)) return [];
  return res.data.map(mapApiUser);
}

export async function fetchUserById(id: string): Promise<ApiUser | null> {
  const res = await getApiV1UsersId(id);
  if (res.status !== 200 || !res.data || typeof res.data !== "object") return null;
  return mapApiUser(res.data);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  profile?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  expiredDate?: string | null;
}): Promise<boolean> {
  const payload: GithubComYourUsernameBackendProjectInternalServiceCreateUserInput = {
    name: input.name,
    email: input.email,
    password: input.password,
    profile: input.profile,
    isActive: input.isActive ?? true,
    isAdmin: input.isAdmin ?? false,
    expiredDate: input.expiredDate ?? undefined,
  };
  const res = await postApiV1Users(payload);
  return res.status === 201;
}

export async function updateUser(
  id: string,
  input: {
    name: string;
    email: string;
    password?: string;
    profile?: string;
    isAdmin?: boolean;
    isActive?: boolean;
    expiredDate?: string | null;
  }
): Promise<boolean> {
  const payload: GithubComYourUsernameBackendProjectInternalServiceUpdateUserInput = {
    name: input.name,
    email: input.email,
    ...(input.password ? { password: input.password } : {}),
    profile: input.profile,
    isActive: input.isActive,
    isAdmin: input.isAdmin,
    expiredDate: input.expiredDate ?? undefined,
  };
  const res = await putApiV1UsersId(id, payload);
  return res.status === 200;
}

export async function deleteUserAccount(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await deleteApiV1UsersId(id);
  if (res.status === 204) {
    return { ok: true };
  }
  const data = asRecord(res.data);
  return {
    ok: false,
    message: asString(data.message, `ลบไม่สำเร็จ (HTTP ${res.status})`),
  };
}

export type AuthLoginResult = {
  ok: boolean;
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  expiredDate: string | null;
  token: string | null;
  message: string;
};

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthLoginResult> {
  const payload: GithubComYourUsernameBackendProjectInternalServiceLoginInput = {
    email: input.email,
    password: input.password,
  };
  const res = await postApiV1AuthLogin(payload);
  const data = asRecord(res.data);
  const user = asRecord(data.user);

  if (res.status !== 200) {
    return {
      ok: false,
      id: "",
      name: "",
      email: input.email,
      isAdmin: false,
      expiredDate: null,
      token: null,
      message: asString(data.message, "เข้าสู่ระบบไม่สำเร็จ"),
    };
  }

  return {
    ok: true,
    id: asString(user.id || user._id, asString(data.userId || data.id, input.email)),
    name: asString(user.name, asString(data.name, input.email.split("@")[0] || "ผู้ใช้")),
    email: asString(user.email, asString(data.email, input.email)),
    isAdmin: Boolean(user.isAdmin ?? data.isAdmin ?? data.role === "admin"),
    expiredDate:
      typeof user.expiredDate === "string"
        ? user.expiredDate
        : typeof data.expiredDate === "string"
          ? data.expiredDate
          : null,
    token: asString(data.token) || null,
    message: asString(data.message, ""),
  };
}
