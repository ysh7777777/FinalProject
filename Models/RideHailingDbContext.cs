using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Models;

public partial class RideHailingDbContext : DbContext
{
    public RideHailingDbContext()
    {
    }

    public RideHailingDbContext(DbContextOptions<RideHailingDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Driver> Drivers { get; set; }

    public virtual DbSet<DriverLocationLog> DriverLocationLogs { get; set; }

    public virtual DbSet<DriverShiftSchedule> DriverShiftSchedules { get; set; }

    public virtual DbSet<MapLandmark> MapLandmarks { get; set; }

    public virtual DbSet<Member> Members { get; set; }

    public virtual DbSet<MemberSavedAddress> MemberSavedAddresses { get; set; }

    public virtual DbSet<ProjectImage> ProjectImages { get; set; }

    public virtual DbSet<Trip> Trips { get; set; }

    public virtual DbSet<Vehicle> Vehicles { get; set; }

    // 因為新增 VehicleMenu 表單，所以新增 (08/23 益)
    public virtual DbSet<VehicleMenu> VehicleMenu { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=.;Database=RideHailingDB;Trusted_Connection=True;Integrated Security=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Driver>(entity =>
        {
            entity.HasKey(e => e.DriverId).HasName("PK__driver__A411C5BD79660226");

            entity.ToTable("driver");

            entity.Property(e => e.DriverId)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("driver_id");
            entity.Property(e => e.BaseLocation)
                .HasMaxLength(50)
                .HasColumnName("base_location");
            entity.Property(e => e.DriverName)
                .HasMaxLength(50)
                .HasColumnName("driver_name");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("password");
        });

        modelBuilder.Entity<DriverLocationLog>(entity =>
        {
            entity.HasKey(e => e.LocationId).HasName("PK__driver_l__771831EA3327823B");

            entity.ToTable("driver_location_log");

            entity.Property(e => e.LocationId).HasColumnName("location_id");
            entity.Property(e => e.DriverId)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("driver_id");
            entity.Property(e => e.Heading).HasColumnName("heading");
            entity.Property(e => e.Latitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("latitude");
            entity.Property(e => e.Longitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("longitude");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Driver).WithMany(p => p.DriverLocationLogs)
                .HasForeignKey(d => d.DriverId)
                .HasConstraintName("FK__driver_lo__drive__59FA5E80");
        });

        modelBuilder.Entity<DriverShiftSchedule>(entity =>
        {
            entity.HasKey(e => e.ShiftId).HasName("PK__driver_s__7B2672201B85D3E4");

            entity.ToTable("driver_shift_schedule");

            entity.Property(e => e.ShiftId)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("shift_id");
            entity.Property(e => e.DriverId)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("driver_id");
            entity.Property(e => e.DriverStatus)
                .HasMaxLength(10)
                .HasColumnName("driver_status");
            entity.Property(e => e.LicensePlate)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("license_plate");
            entity.Property(e => e.ShiftDate).HasColumnName("shift_date");
            entity.Property(e => e.ShiftEnd).HasColumnName("shift_end");
            entity.Property(e => e.ShiftStart).HasColumnName("shift_start");

            entity.HasOne(d => d.Driver).WithMany(p => p.DriverShiftSchedules)
                .HasForeignKey(d => d.DriverId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__driver_sh__drive__5535A963");

            entity.HasOne(d => d.LicensePlateNavigation).WithMany(p => p.DriverShiftSchedules)
                .HasForeignKey(d => d.LicensePlate)
                .HasConstraintName("FK__driver_sh__licen__5629CD9C");
        });

        modelBuilder.Entity<MapLandmark>(entity =>
        {
            entity.HasKey(e => e.LandmarkId).HasName("PK__map_land__7BB4F771D8003E00");

            entity.ToTable("map_landmark");

            entity.Property(e => e.LandmarkId).HasColumnName("landmark_id");
            entity.Property(e => e.AddressText)
                .HasMaxLength(200)
                .HasColumnName("address_text");
            entity.Property(e => e.LandmarkName)
                .HasMaxLength(100)
                .HasColumnName("landmark_name");
            entity.Property(e => e.Latitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("latitude");
            entity.Property(e => e.Longitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("longitude");
        });

        modelBuilder.Entity<Member>(entity =>
        {
            entity.HasKey(e => e.Account).HasName("PK__member__EA162E107376D698");

            entity.ToTable("member");

            entity.Property(e => e.Account)
                .HasMaxLength(50)
                .HasColumnName("account");
            entity.Property(e => e.Email)
                .HasMaxLength(254)
                .HasColumnName("email");
            entity.Property(e => e.FullName)
                .HasMaxLength(50)
                .HasColumnName("full_name");
            entity.Property(e => e.Gender)
                .HasMaxLength(10)
                .HasColumnName("gender");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasColumnName("password");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("phone_number");
        });

        modelBuilder.Entity<MemberSavedAddress>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("PK__member_s__CAA247C8CFB284AB");

            entity.ToTable("member_saved_address");

            entity.Property(e => e.AddressId).HasColumnName("address_id");
            entity.Property(e => e.Account)
                .HasMaxLength(50)
                .HasColumnName("account");
            entity.Property(e => e.AddressText)
                .HasMaxLength(200)
                .HasColumnName("address_text");
            entity.Property(e => e.Label)
                .HasMaxLength(20)
                .HasColumnName("label");
            entity.Property(e => e.Latitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("latitude");
            entity.Property(e => e.Longitude)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("longitude");

            entity.HasOne(d => d.AccountNavigation).WithMany(p => p.MemberSavedAddresses)
                .HasForeignKey(d => d.Account)
                .HasConstraintName("FK__member_sa__accou__4D94879B");
        });

        modelBuilder.Entity<ProjectImage>(entity =>
        {
            entity.HasKey(e => e.ImageId).HasName("PK__project___DC9AC9558365D004");

            entity.ToTable("project_image");

            entity.Property(e => e.ImageId).HasColumnName("image_id");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
            entity.Property(e => e.ImageTitle)
                .HasMaxLength(100)
                .HasColumnName("image_title");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .HasColumnName("image_url");
        });

        modelBuilder.Entity<Trip>(entity =>
        {
            entity.HasKey(e => e.OrderNo).HasName("PK__trip__465C81B90A09EE81");

            entity.ToTable("trip");

            entity.Property(e => e.OrderNo)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("order_no");
            entity.Property(e => e.Account)
                .HasMaxLength(50)
                .HasColumnName("account");
            entity.Property(e => e.AssignedDriverId)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("assigned_driver_id");
            entity.Property(e => e.CanceledAt)
                .HasColumnType("smalldatetime")
                .HasColumnName("canceled_at");
            entity.Property(e => e.CompletedAt)
                .HasColumnType("smalldatetime")
                .HasColumnName("completed_at");
            entity.Property(e => e.DepartureTime)
                .HasColumnType("smalldatetime")
                .HasColumnName("departure_time");
            entity.Property(e => e.Destination)
                .HasMaxLength(200)
                .HasColumnName("destination");
            entity.Property(e => e.DestinationLat)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("destination_lat");
            entity.Property(e => e.DestinationLng)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("destination_lng");
            entity.Property(e => e.EstimatedDuration).HasColumnName("estimated_duration");
            entity.Property(e => e.LicensePlate)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("license_plate");
            entity.Property(e => e.LuggageCount).HasColumnName("luggage_count");
            entity.Property(e => e.PassengerCount).HasColumnName("passenger_count");
            entity.Property(e => e.PickupLat)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("pickup_lat");
            entity.Property(e => e.PickupLng)
                .HasColumnType("decimal(9, 6)")
                .HasColumnName("pickup_lng");
            entity.Property(e => e.PickupLocation)
                .HasMaxLength(200)
                .HasColumnName("pickup_location");
            entity.Property(e => e.TripStatus)
                .HasMaxLength(10)
                .HasColumnName("trip_status");
            entity.Property(e => e.VehicleType)
                .HasMaxLength(20)
                .HasColumnName("vehicle_type");

            entity.HasOne(d => d.AccountNavigation).WithMany(p => p.Trips)
                .HasForeignKey(d => d.Account)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__trip__account__5CD6CB2B");

            entity.HasOne(d => d.AssignedDriver).WithMany(p => p.Trips)
                .HasForeignKey(d => d.AssignedDriverId)
                .HasConstraintName("FK__trip__assigned_d__5EBF139D");

            entity.HasOne(d => d.LicensePlateNavigation).WithMany(p => p.Trips)
                .HasForeignKey(d => d.LicensePlate)
                .HasConstraintName("FK__trip__license_pl__5DCAEF64");

            // 因為新增 trip 表單的 baby_seat 及 fare，所以新增 (08/28 益)
            entity.Property(e => e.BabySeat)
                .HasDefaultValue((byte)0)
                .HasColumnName("baby_seat");
            entity.Property(e => e.Fare)
                .HasColumnName("fare");
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.LicensePlate).HasName("PK__vehicle__F72CD56FB985A6DB");

            entity.ToTable("vehicle");

            entity.Property(e => e.LicensePlate)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("license_plate");
            entity.Property(e => e.BaseFare).HasColumnName("base_fare");
            entity.Property(e => e.BaseLocation)
                .HasMaxLength(50)
                .HasColumnName("base_location");
            entity.Property(e => e.ChildSeats)
                .HasDefaultValue((byte)0)
                .HasColumnName("child_seats");
            entity.Property(e => e.MaxLuggage).HasColumnName("max_luggage");
            entity.Property(e => e.MaxPassengers).HasColumnName("max_passengers");
            entity.Property(e => e.VehicleStatus)
                .HasMaxLength(10)
                .HasColumnName("vehicle_status");
            entity.Property(e => e.VehicleType)
                .HasMaxLength(20)
                .HasColumnName("vehicle_type");
        });
        // 因為新增 VehicleMenu 表單，所以新增 (08/23 益)
        modelBuilder.Entity<VehicleMenu>(entity =>
        {
            entity.HasKey(e => e.VehicleId);

            entity.ToTable("vehicle_menu");

            entity.Property(e => e.VehicleId)
                .ValueGeneratedOnAdd()
                .HasColumnName("vehicle_id");

            entity.Property(e => e.VehicleType)
                .HasMaxLength(20)
                .HasColumnName("vehicle_type");

            entity.Property(e => e.MaxPassengers)
                .HasColumnName("max_passengers");

            entity.Property(e => e.MaxLuggage)
                .HasColumnName("max_luggage");

            entity.Property(e => e.ChildSeats)
                .HasDefaultValue((byte)0)
                .HasColumnName("child_seats");

            entity.Property(e => e.BaseFare)
                .HasColumnName("base_fare");

            entity.Property(e => e.ImageTitle)
                .HasMaxLength(100)
                .IsRequired()
                .HasColumnName("image_title");

            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .HasColumnName("image_url");

            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
        });


        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
