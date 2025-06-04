-- 1) Clientes
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    telefono   VARCHAR(20) UNIQUE,             -- No puede haber dos clientes con el mismo teléfono
    correo     VARCHAR(100) UNIQUE             -- No puede haber dos clientes con el mismo correo
);

-- 2) Barberos
CREATE TABLE barberos (
    id_barbero   SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100)
);

-- 3) Horarios generales de la barbería
CREATE TABLE horarios (
    id_horario  SERIAL PRIMARY KEY,
    dia_semana  VARCHAR(10) NOT NULL
                  CHECK (dia_semana IN (
                    'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'
                  )),
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL
);

-- 4) Horarios específicos de cada barbero
CREATE TABLE horarios_barbero (
    id_horario_barbero SERIAL PRIMARY KEY,
    id_barbero         INTEGER NOT NULL REFERENCES barberos(id_barbero),
    dia_semana         VARCHAR(10) NOT NULL
                         CHECK (dia_semana IN (
                           'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'
                         )),
    hora_inicio        TIME NOT NULL,
    hora_fin           TIME NOT NULL,
    estado             VARCHAR(10) DEFAULT 'activo'
                         CHECK (estado IN ('activo','inactivo'))
);

-- 5) Bloqueos por barbero (franjas en las que el barbero no aceptará reservas)
CREATE TABLE bloqueos_barbero (
    id_bloqueo   SERIAL PRIMARY KEY,
    id_barbero   INTEGER NOT NULL REFERENCES barberos(id_barbero),
    fecha        DATE    NOT NULL,
    hora_inicio  TIME    NOT NULL,
    hora_fin     TIME    NOT NULL,
    motivo       TEXT,
    estado       VARCHAR(10) DEFAULT 'activo'
                 CHECK (estado IN ('activo','inactivo'))
);

-- 6) Reservas (el front envía nombre de servicio y precio, en lugar de un FK a tabla “servicios”)
CREATE TABLE reservas (
    id_reserva       SERIAL PRIMARY KEY,
    id_cliente       INTEGER NOT NULL REFERENCES clientes(id_cliente),
    id_barbero       INTEGER NOT NULL REFERENCES barberos(id_barbero),
    servicio_nombre  VARCHAR(100) NOT NULL,
    servicio_precio  DECIMAL(10,2) NOT NULL,
    fecha            DATE    NOT NULL,
    hora             TIME    NOT NULL,
    estado           VARCHAR(10) NOT NULL DEFAULT 'confirmado'
                     CHECK (estado IN ('confirmado','cancelado'))
);

-- 7) Restricción de unicidad: un barbero no puede tener dos reservas confirmadas en la misma fecha y hora
ALTER TABLE reservas
  ADD CONSTRAINT unica_reserva_barbero
  UNIQUE (id_barbero, fecha, hora);
