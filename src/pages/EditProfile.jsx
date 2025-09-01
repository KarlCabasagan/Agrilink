function EditProfile() {
  return (
    <>
      <div className="min-h-screen w-full flex items-center flex-col text-text">
        <div className="max-w-2xl w-full items-center text-text sm:shadow">
          <div className="w-full h-36 bg-primary sm:rounded-t-lg p-4 mb-12">
            <h1 className="text-2xl font-bold my-4">Edit Profile</h1>
            <div className="w-80 flex gap-4">
              <div className="">
                <img
                  src="/assets/adel.jpg"
                  alt="profile"
                  className="h-28 w-28 object-cover rounded-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="file"
                  id="profilePicture"
                  className="hidden"
                  onChange={(e) => handleProfileChange(e)}
                />
                <label
                  htmlFor="profilePicture"
                  className="cursor-pointer bg-secondary text-white shadow-lg px-4 py-2 rounded-lg hover:bg-secondary-dark"
                >
                  Change Picture
                </label>
              </div>
              <form action=""></form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditProfile;
