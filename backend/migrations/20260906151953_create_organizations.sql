-- Up Migration
CREATE TABLE organizations (
  id uuid NOT NULL,
  name text NOT NULL,
  slug varchar(63) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_organizations PRIMARY KEY (id),
  CONSTRAINT uq_organizations__slug UNIQUE (slug),
  CONSTRAINT chk_organizations__name_not_blank CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT chk_organizations__slug_format CHECK (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT chk_organizations__status CHECK (
    status IN ('active', 'suspended', 'inactive')
  )
);

-- Down Migration
DROP TABLE organizations;
