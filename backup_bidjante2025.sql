--
-- PostgreSQL database dump
--

\restrict ITGlGXANtktkyvZiTRKsjrQPOrLIG0s9aAVGiLl3anXcVfFHShiktUGQQgROzNP

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CanalDiffusion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CanalDiffusion" AS ENUM (
    'GRIOT',
    'SMS',
    'EMAIL',
    'WHATSAPP',
    'PUSH'
);


ALTER TYPE public."CanalDiffusion" OWNER TO postgres;

--
-- Name: CibleType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CibleType" AS ENUM (
    'ALL',
    'FAMILLE',
    'LIGNEE',
    'CATEGORIE',
    'CUSTOM'
);


ALTER TYPE public."CibleType" OWNER TO postgres;

--
-- Name: CommuniqueStatut; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CommuniqueStatut" AS ENUM (
    'BROUILLON',
    'PUBLIE',
    'ARCHIVE'
);


ALTER TYPE public."CommuniqueStatut" OWNER TO postgres;

--
-- Name: CommuniqueType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CommuniqueType" AS ENUM (
    'GRIOT',
    'REUNION',
    'CONVOCATION',
    'DECES',
    'COTISATION',
    'GENERAL'
);


ALTER TYPE public."CommuniqueType" OWNER TO postgres;

--
-- Name: DiffusionStatut; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DiffusionStatut" AS ENUM (
    'ENVOYE',
    'ECHEC'
);


ALTER TYPE public."DiffusionStatut" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Categorie; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Categorie" (
    id text NOT NULL,
    label text NOT NULL,
    generation text NOT NULL,
    classe text NOT NULL,
    born_from integer,
    born_to integer,
    date_sortie_1er_guerrier timestamp(3) without time zone NOT NULL,
    date_sortie_2eme_guerrier timestamp(3) without time zone,
    description text
);


ALTER TABLE public."Categorie" OWNER TO postgres;

--
-- Name: Communique; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Communique" (
    id text NOT NULL,
    titre text NOT NULL,
    contenu text NOT NULL,
    type public."CommuniqueType" NOT NULL,
    statut public."CommuniqueStatut" NOT NULL,
    canaux text[],
    "cibleType" public."CibleType" NOT NULL,
    "cibleIds" text[],
    "datePublication" timestamp(3) without time zone,
    "dateArchivage" timestamp(3) without time zone,
    "createdById" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Communique" OWNER TO postgres;

--
-- Name: Cotisation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Cotisation" (
    id integer NOT NULL,
    "membreId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    montant integer NOT NULL,
    motif text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "decesId" text,
    "statutCotisation" text DEFAULT 'Impaye'::text NOT NULL
);


ALTER TABLE public."Cotisation" OWNER TO postgres;

--
-- Name: CotisationLignee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CotisationLignee" (
    id integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    montant integer NOT NULL,
    motif text,
    statut text DEFAULT 'Impaye'::text NOT NULL,
    "decesId" text NOT NULL,
    "ligneeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "paidAt" timestamp(3) without time zone
);


ALTER TABLE public."CotisationLignee" OWNER TO postgres;

--
-- Name: CotisationLignee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CotisationLignee_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CotisationLignee_id_seq" OWNER TO postgres;

--
-- Name: CotisationLignee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CotisationLignee_id_seq" OWNED BY public."CotisationLignee".id;


--
-- Name: Cotisation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Cotisation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Cotisation_id_seq" OWNER TO postgres;

--
-- Name: Cotisation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Cotisation_id_seq" OWNED BY public."Cotisation".id;


--
-- Name: Deces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Deces" (
    id text NOT NULL,
    "membreId" text NOT NULL,
    "dateDeces" timestamp(3) without time zone NOT NULL,
    motif text
);


ALTER TABLE public."Deces" OWNER TO postgres;

--
-- Name: DiffusionHistorique; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DiffusionHistorique" (
    id text NOT NULL,
    "communiqueId" text NOT NULL,
    canal public."CanalDiffusion" NOT NULL,
    destinataire text NOT NULL,
    statut public."DiffusionStatut" NOT NULL,
    "messageRetour" text,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DiffusionHistorique" OWNER TO postgres;

--
-- Name: Enterrement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Enterrement" (
    id text NOT NULL,
    "decesId" text NOT NULL,
    "declareAuVillage" boolean DEFAULT false NOT NULL,
    "funeraillesAuVillage" boolean DEFAULT false NOT NULL,
    "enterreAuVillage" boolean DEFAULT false NOT NULL,
    "lieuEnterrement" text,
    "dateEnterrement" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Enterrement" OWNER TO postgres;

--
-- Name: GrandeFamille; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GrandeFamille" (
    id text NOT NULL,
    nom text NOT NULL
);


ALTER TABLE public."GrandeFamille" OWNER TO postgres;

--
-- Name: HistoriqueChefLignee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HistoriqueChefLignee" (
    id text NOT NULL,
    "ligneeId" text NOT NULL,
    "membreId" text NOT NULL,
    "dateDebut" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dateFin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."HistoriqueChefLignee" OWNER TO postgres;

--
-- Name: Lignee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Lignee" (
    id text NOT NULL,
    nom text NOT NULL,
    "familleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "chefLigneeId" text
);


ALTER TABLE public."Lignee" OWNER TO postgres;

--
-- Name: Membre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Membre" (
    id text NOT NULL,
    nom text NOT NULL,
    prenoms text NOT NULL,
    genre text NOT NULL,
    "dateNaissance" timestamp(3) without time zone,
    photo text,
    "categorieId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ligneeId" text NOT NULL,
    "updatedAt" timestamp(3) without time zone,
    "statutMembre" text DEFAULT 'Actif'::text NOT NULL,
    contact1 text,
    contact2 text,
    email text
);


ALTER TABLE public."Membre" OWNER TO postgres;

--
-- Name: MenuGroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MenuGroup" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    visible boolean DEFAULT true NOT NULL
);


ALTER TABLE public."MenuGroup" OWNER TO postgres;

--
-- Name: MenuGroup_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."MenuGroup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MenuGroup_id_seq" OWNER TO postgres;

--
-- Name: MenuGroup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."MenuGroup_id_seq" OWNED BY public."MenuGroup".id;


--
-- Name: MenuItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MenuItem" (
    id integer NOT NULL,
    label text NOT NULL,
    path text,
    icon text,
    "order" integer DEFAULT 0 NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    "minRole" text DEFAULT 'user'::text NOT NULL,
    "groupId" integer,
    "parentId" integer
);


ALTER TABLE public."MenuItem" OWNER TO postgres;

--
-- Name: MenuItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."MenuItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MenuItem_id_seq" OWNER TO postgres;

--
-- Name: MenuItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."MenuItem_id_seq" OWNED BY public."MenuItem".id;


--
-- Name: Paiement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Paiement" (
    id integer NOT NULL,
    "cotisationId" integer NOT NULL,
    montant integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mode text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Paiement" OWNER TO postgres;

--
-- Name: PaiementLignee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaiementLignee" (
    id integer NOT NULL,
    "cotisationId" integer NOT NULL,
    montant integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mode text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PaiementLignee" OWNER TO postgres;

--
-- Name: PaiementLignee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PaiementLignee_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PaiementLignee_id_seq" OWNER TO postgres;

--
-- Name: PaiementLignee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PaiementLignee_id_seq" OWNED BY public."PaiementLignee".id;


--
-- Name: Paiement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Paiement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Paiement_id_seq" OWNER TO postgres;

--
-- Name: Paiement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Paiement_id_seq" OWNED BY public."Paiement".id;


--
-- Name: Setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Setting" (
    id integer NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    value text,
    type text NOT NULL,
    meta text,
    "categoryId" integer NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "minRole" text,
    visible boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Setting" OWNER TO postgres;

--
-- Name: SettingCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SettingCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL
);


ALTER TABLE public."SettingCategory" OWNER TO postgres;

--
-- Name: SettingCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SettingCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SettingCategory_id_seq" OWNER TO postgres;

--
-- Name: SettingCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SettingCategory_id_seq" OWNED BY public."SettingCategory".id;


--
-- Name: Setting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Setting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Setting_id_seq" OWNER TO postgres;

--
-- Name: Setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Setting_id_seq" OWNED BY public."Setting".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text,
    role text DEFAULT 'user'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    active boolean DEFAULT true NOT NULL,
    password text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    username text NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Cotisation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cotisation" ALTER COLUMN id SET DEFAULT nextval('public."Cotisation_id_seq"'::regclass);


--
-- Name: CotisationLignee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CotisationLignee" ALTER COLUMN id SET DEFAULT nextval('public."CotisationLignee_id_seq"'::regclass);


--
-- Name: MenuGroup id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuGroup" ALTER COLUMN id SET DEFAULT nextval('public."MenuGroup_id_seq"'::regclass);


--
-- Name: MenuItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuItem" ALTER COLUMN id SET DEFAULT nextval('public."MenuItem_id_seq"'::regclass);


--
-- Name: Paiement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Paiement" ALTER COLUMN id SET DEFAULT nextval('public."Paiement_id_seq"'::regclass);


--
-- Name: PaiementLignee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaiementLignee" ALTER COLUMN id SET DEFAULT nextval('public."PaiementLignee_id_seq"'::regclass);


--
-- Name: Setting id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting" ALTER COLUMN id SET DEFAULT nextval('public."Setting_id_seq"'::regclass);


--
-- Name: SettingCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SettingCategory" ALTER COLUMN id SET DEFAULT nextval('public."SettingCategory_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Categorie; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Categorie" (id, label, generation, classe, born_from, born_to, date_sortie_1er_guerrier, date_sortie_2eme_guerrier, description) FROM stdin;
\.


--
-- Data for Name: Communique; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Communique" (id, titre, contenu, type, statut, canaux, "cibleType", "cibleIds", "datePublication", "dateArchivage", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Cotisation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Cotisation" (id, "membreId", date, montant, motif, "createdAt", "paidAt", "decesId", "statutCotisation") FROM stdin;
\.


--
-- Data for Name: CotisationLignee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CotisationLignee" (id, date, montant, motif, statut, "decesId", "ligneeId", "createdAt", "paidAt") FROM stdin;
\.


--
-- Data for Name: Deces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Deces" (id, "membreId", "dateDeces", motif) FROM stdin;
\.


--
-- Data for Name: DiffusionHistorique; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DiffusionHistorique" (id, "communiqueId", canal, destinataire, statut, "messageRetour", "sentAt") FROM stdin;
\.


--
-- Data for Name: Enterrement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Enterrement" (id, "decesId", "declareAuVillage", "funeraillesAuVillage", "enterreAuVillage", "lieuEnterrement", "dateEnterrement", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GrandeFamille; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GrandeFamille" (id, nom) FROM stdin;
\.


--
-- Data for Name: HistoriqueChefLignee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HistoriqueChefLignee" (id, "ligneeId", "membreId", "dateDebut", "dateFin", "createdAt") FROM stdin;
\.


--
-- Data for Name: Lignee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Lignee" (id, nom, "familleId", "createdAt", "updatedAt", "chefLigneeId") FROM stdin;
\.


--
-- Data for Name: Membre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Membre" (id, nom, prenoms, genre, "dateNaissance", photo, "categorieId", "createdAt", "ligneeId", "updatedAt", "statutMembre", contact1, contact2, email) FROM stdin;
\.


--
-- Data for Name: MenuGroup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MenuGroup" (id, name, code, "order", visible) FROM stdin;
\.


--
-- Data for Name: MenuItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MenuItem" (id, label, path, icon, "order", visible, "minRole", "groupId", "parentId") FROM stdin;
\.


--
-- Data for Name: Paiement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Paiement" (id, "cotisationId", montant, date, mode, "createdAt") FROM stdin;
\.


--
-- Data for Name: PaiementLignee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaiementLignee" (id, "cotisationId", montant, date, mode, "createdAt") FROM stdin;
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Setting" (id, key, label, value, type, meta, "categoryId", "updatedAt", "minRole", visible) FROM stdin;
\.


--
-- Data for Name: SettingCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SettingCategory" (id, name, code) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, role, "createdAt", active, password, "updatedAt", username) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
15cea7ae-c33c-4eca-8356-f8384ce1f19b	60fa7ba9a575849a7bb6c23bbf6cfb6b2dae765880d75a34dc77c29d559540b5	2025-12-20 03:45:37.320999+00	000_baseline	\N	\N	2025-12-20 03:45:37.152876+00	1
92a67e8e-2e78-4ef2-b94d-ca5e6061aacf	6377fb96b5ad8a660ac9979d51161fcbb44dfd4017c3a8e615586499192db2b8	2025-12-20 03:45:37.350406+00	001_add_chef_lignee	\N	\N	2025-12-20 03:45:37.322127+00	1
2bb7847e-c09d-47c4-b090-e1c004c23dc6	2bb7a3331650eeb1e1e0b1063a022275712dbc5b629b20f2a56a3e9051fa83b8	2025-12-20 03:45:37.353937+00	002_baseline_existing_schema	\N	\N	2025-12-20 03:45:37.351286+00	1
\.


--
-- Name: CotisationLignee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CotisationLignee_id_seq"', 1, false);


--
-- Name: Cotisation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Cotisation_id_seq"', 1, false);


--
-- Name: MenuGroup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."MenuGroup_id_seq"', 1, false);


--
-- Name: MenuItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."MenuItem_id_seq"', 1, false);


--
-- Name: PaiementLignee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PaiementLignee_id_seq"', 1, false);


--
-- Name: Paiement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Paiement_id_seq"', 1, false);


--
-- Name: SettingCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SettingCategory_id_seq"', 1, false);


--
-- Name: Setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Setting_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, false);


--
-- Name: Categorie Categorie_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Categorie"
    ADD CONSTRAINT "Categorie_pkey" PRIMARY KEY (id);


--
-- Name: Communique Communique_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Communique"
    ADD CONSTRAINT "Communique_pkey" PRIMARY KEY (id);


--
-- Name: CotisationLignee CotisationLignee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CotisationLignee"
    ADD CONSTRAINT "CotisationLignee_pkey" PRIMARY KEY (id);


--
-- Name: Cotisation Cotisation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cotisation"
    ADD CONSTRAINT "Cotisation_pkey" PRIMARY KEY (id);


--
-- Name: Deces Deces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deces"
    ADD CONSTRAINT "Deces_pkey" PRIMARY KEY (id);


--
-- Name: DiffusionHistorique DiffusionHistorique_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DiffusionHistorique"
    ADD CONSTRAINT "DiffusionHistorique_pkey" PRIMARY KEY (id);


--
-- Name: Enterrement Enterrement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enterrement"
    ADD CONSTRAINT "Enterrement_pkey" PRIMARY KEY (id);


--
-- Name: GrandeFamille GrandeFamille_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GrandeFamille"
    ADD CONSTRAINT "GrandeFamille_pkey" PRIMARY KEY (id);


--
-- Name: HistoriqueChefLignee HistoriqueChefLignee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HistoriqueChefLignee"
    ADD CONSTRAINT "HistoriqueChefLignee_pkey" PRIMARY KEY (id);


--
-- Name: Lignee Lign├⌐e_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lignee"
    ADD CONSTRAINT "Lign├⌐e_pkey" PRIMARY KEY (id);


--
-- Name: Membre Membre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membre"
    ADD CONSTRAINT "Membre_pkey" PRIMARY KEY (id);


--
-- Name: MenuGroup MenuGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuGroup"
    ADD CONSTRAINT "MenuGroup_pkey" PRIMARY KEY (id);


--
-- Name: MenuItem MenuItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT "MenuItem_pkey" PRIMARY KEY (id);


--
-- Name: PaiementLignee PaiementLignee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaiementLignee"
    ADD CONSTRAINT "PaiementLignee_pkey" PRIMARY KEY (id);


--
-- Name: Paiement Paiement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Paiement"
    ADD CONSTRAINT "Paiement_pkey" PRIMARY KEY (id);


--
-- Name: SettingCategory SettingCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SettingCategory"
    ADD CONSTRAINT "SettingCategory_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: CotisationLignee_decesId_ligneeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CotisationLignee_decesId_ligneeId_key" ON public."CotisationLignee" USING btree ("decesId", "ligneeId");


--
-- Name: Cotisation_membreId_decesId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Cotisation_membreId_decesId_key" ON public."Cotisation" USING btree ("membreId", "decesId");


--
-- Name: Deces_membreId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Deces_membreId_key" ON public."Deces" USING btree ("membreId");


--
-- Name: Enterrement_decesId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Enterrement_decesId_key" ON public."Enterrement" USING btree ("decesId");


--
-- Name: GrandeFamille_nom_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "GrandeFamille_nom_key" ON public."GrandeFamille" USING btree (nom);


--
-- Name: Lignee_nom_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Lignee_nom_key" ON public."Lignee" USING btree (nom);


--
-- Name: Membre_nom_prenoms_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Membre_nom_prenoms_key" ON public."Membre" USING btree (nom, prenoms);


--
-- Name: MenuGroup_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MenuGroup_code_key" ON public."MenuGroup" USING btree (code);


--
-- Name: MenuItem_path_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MenuItem_path_key" ON public."MenuItem" USING btree (path);


--
-- Name: SettingCategory_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SettingCategory_code_key" ON public."SettingCategory" USING btree (code);


--
-- Name: Setting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_key_key" ON public."Setting" USING btree (key);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: CotisationLignee CotisationLignee_decesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CotisationLignee"
    ADD CONSTRAINT "CotisationLignee_decesId_fkey" FOREIGN KEY ("decesId") REFERENCES public."Deces"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CotisationLignee CotisationLignee_ligneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CotisationLignee"
    ADD CONSTRAINT "CotisationLignee_ligneeId_fkey" FOREIGN KEY ("ligneeId") REFERENCES public."Lignee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Cotisation Cotisation_decesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cotisation"
    ADD CONSTRAINT "Cotisation_decesId_fkey" FOREIGN KEY ("decesId") REFERENCES public."Deces"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Cotisation Cotisation_membreId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cotisation"
    ADD CONSTRAINT "Cotisation_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES public."Membre"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Deces Deces_membreId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deces"
    ADD CONSTRAINT "Deces_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES public."Membre"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Enterrement Enterrement_decesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enterrement"
    ADD CONSTRAINT "Enterrement_decesId_fkey" FOREIGN KEY ("decesId") REFERENCES public."Deces"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lignee Lign├⌐e_familleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lignee"
    ADD CONSTRAINT "Lign├⌐e_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES public."GrandeFamille"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Membre Membre_categorieId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membre"
    ADD CONSTRAINT "Membre_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES public."Categorie"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Membre Membre_ligneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membre"
    ADD CONSTRAINT "Membre_ligneeId_fkey" FOREIGN KEY ("ligneeId") REFERENCES public."Lignee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MenuItem MenuItem_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT "MenuItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."MenuGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MenuItem MenuItem_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."MenuItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PaiementLignee PaiementLignee_cotisationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaiementLignee"
    ADD CONSTRAINT "PaiementLignee_cotisationId_fkey" FOREIGN KEY ("cotisationId") REFERENCES public."CotisationLignee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paiement Paiement_cotisationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Paiement"
    ADD CONSTRAINT "Paiement_cotisationId_fkey" FOREIGN KEY ("cotisationId") REFERENCES public."Cotisation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Setting Setting_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."SettingCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict ITGlGXANtktkyvZiTRKsjrQPOrLIG0s9aAVGiLl3anXcVfFHShiktUGQQgROzNP

